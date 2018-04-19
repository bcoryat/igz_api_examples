package demo

import java.nio.file.Paths

import ch.hsr.geohash.GeoHash
import com.typesafe.config.{Config, ConfigFactory}
import io.iguaz.v3io.api.container._
import io.iguaz.v3io.daemon.client.api.consts.ConfigProperty
import io.iguaz.v3io.kv.Filters._
import io.iguaz.v3io.kv.{KeyValueOperations, OverwriteMode, SimpleRow}
import io.iguaz.v3io.spark.streaming.{RecordAndMetadata, StringDecoder}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.{Row, SparkSession}
import org.apache.spark.streaming.v3io.V3IOUtils
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.json4s.JsonAST.JString
import org.json4s.jackson.JsonMethods._
import org.slf4j.{Logger, LoggerFactory}

import scala.collection.JavaConverters._
import scalaj.http.{Http, HttpOptions}


object WeatherFeedback {
  implicit val config: Config = ConfigFactory.load("weather-feedback.conf")

  val appName: String = config.getString("application.name")
  val inputContainerName: String = config.getString("input.container.name")
  val streamNames: Set[String] = config.getStringList("input.topic.name").asScala.toSet
  val outputCollectionBaseDir: String = config.getString("output.collection.base.dir")
  val readBufferSize: Int = config.getInt("v3io.data.block.size")
  val batchDuration: Int = config.getInt("spark.streaming.batch.duration.seconds")
  val latitudeZero: Double = config.getDouble("input.data.reset.latitude")
  val longitudeZero: Double = config.getDouble("input.data.reset.longitude")
  val weatherServiceHost: String = config.getString("services.weather.host")
  val weatherServicePort: Int = config.getInt("services.weather.port")
  val weatherURI: String = config.getString("services.weather.uri")
  val weatherService = s"$weatherServiceHost:$weatherServicePort$weatherURI"

  val inputContainerCfg = Map(
    ConfigProperty.DEFAULT_DATA_BLOCK_SIZE -> readBufferSize.toString,
    ConfigProperty.CONTAINER_ALIAS -> inputContainerName
  )

  @transient protected val log: Logger = LoggerFactory.getLogger(this.getClass.getName.stripSuffix("$"))

  def main(args: Array[String]): Unit = {
    run()
  }

  def run(): Unit = {
    log.trace(s"About to process streaming data from the following topics: $streamNames for container $inputContainerName")

    val spark = SparkSession.builder().appName(appName).getOrCreate()
    val ssc = new StreamingContext(spark.sparkContext, Seconds(batchDuration))

    val rawDataStream = {
      val messageHandler = (rmd: RecordAndMetadata[String]) => rmd.payload()
      V3IOUtils.createDirectStream[String, StringDecoder, String](
        ssc,
        inputContainerCfg,
        streamNames,
        messageHandler)
    }

    import spark.implicits._

    rawDataStream.foreachRDD { rdd =>
      rdd.cache() //IG-5711
      if (!rdd.isEmpty()) {
        val data = spark.read.json(rdd)
        val flatGPS = data.select($"VIN", explode($"GPS").as("GPSDATA"))
        val maxTS = flatGPS.groupBy($"VIN").max("GPSDATA.T").toDF("VIN", "MaxTS")
        val vinCoords = flatGPS.join(maxTS, flatGPS("VIN") === maxTS("VIN")).where(flatGPS("GPSDATA.T") === maxTS("MaxTS"))
          .select(flatGPS("VIN"), flatGPS("GPSDATA.T"), flatGPS("GPSDATA.LAT").as("LAT"), flatGPS("GPSDATA.LONG").as("LON"))
        vinCoords.foreachPartition { rows =>
          val kvOps = KeyValueOperations(ContainerAlias(inputContainerName), Map.empty[String, Any])
          rows.foreach {
            case Row(vin: String, ts: Long, lat: Double, lon: Double) =>
              val latitude = latitudeZero + lat
              val longitude = longitudeZero + lon
              val weatherValue = weatherService(ts, latitude, longitude)
              // update the record
              val vinData = Paths.get(outputCollectionBaseDir)
              kvOps.update(
                vinData,
                SimpleRow(vin,
                  Map(
                    "VIN" -> vin,
                    "T" -> ts,
                    "LAT" -> latitude,
                    "LON" -> longitude,
                    "GEO4" -> GeoHash.withCharacterPrecision(latitude, longitude, 4).toBase32,
                    "WEATHER" -> weatherValue)
                ),
                OverwriteMode.REPLACE,
                Or(Not(Exists("VIN")), LessThan("T", ts)))
            case r =>
              log.warn(s"Unknown row $r with schema ${r.schema}")
          }

        }
      }
    }
    sys.ShutdownHookThread {
      log.info("Gracefully stopping Spark Streaming Application")
      ssc.stop(stopSparkContext = true, stopGracefully = true)
    }
    ssc.start()
    ssc.awaitTermination()
  }

  private def weatherService(timestamp: Long, lat: Double, lon: Double): String = {
    val url = s"http://$weatherService/$lat,$lon?time=$timestamp"
    log.info("calling url {}", url)
    println(s"calling url $url")
    try {
      val responseBody = Http(url).option(HttpOptions.connTimeout(1000)).option(HttpOptions.readTimeout(5000)).asString.body
      val JString(value) = parse(responseBody) \ "main"
      value
    } catch {
      case e: Exception =>
        log.error(s"Error accessing weather service", e)
        "n/a"
    }

  }
}
