package demo

import java.io.FileNotFoundException
import java.nio.file.Paths

import com.typesafe.config.{Config, ConfigFactory}
import io.iguaz.v3io.api.container._
import io.iguaz.v3io.daemon.client.api.consts.ConfigProperty
import io.iguaz.v3io.kv.Filters._
import io.iguaz.v3io.kv.{Increment, KeyValueOperations, OverwriteMode, SimpleRow, SomeColumns}
import io.iguaz.v3io.spark.streaming.{RecordAndMetadata, StringDecoder}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.{Row, SparkSession}
import org.apache.spark.streaming.v3io.V3IOUtils
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.slf4j.{Logger, LoggerFactory}

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration

object MetricsUpdate {
  @transient protected val log: Logger = LoggerFactory.getLogger(this.getClass.getName.stripSuffix("$"))

  implicit val config: Config = ConfigFactory.load()

  val appName: String = config.getString("application.name")
  val inputContainerName: String = config.getString("input.container.name")
  val streamNames: Set[String] = config.getStringList("input.topic.name").asScala.toSet
  val outputCollectionBaseDir: String = config.getString("output.collection.base.dir")
  val outputMetaBaseDir: String = config.getString("output.collection.meta.dir")
  val readBufferSize: Int = config.getInt("v3io.data.block.size")
  val batchDuration: Int = config.getInt("spark.streaming.batch.duration.seconds")

  val inputContainerCfg = Map(
    ConfigProperty.CONTAINER_ALIAS -> inputContainerName,
    ConfigProperty.DEFAULT_DATA_BLOCK_SIZE -> readBufferSize.toString
  )



  def main(args: Array[String]): Unit = {
    run()
  }


  def run(): Unit = {
    log.trace(s"About to process streaming data from the following topics: $streamNames at container $inputContainerName")

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

        def maxTS = udf { (v: Seq[Row]) =>
          val max = v.map { case Row(t: Long, v: String) => t -> v }.max
          max._2
        }

        try {
          val flat = data.select($"VIN", $"UID",
            when($"CFC".isNotNull, maxTS($"CFC")).otherwise("0.000").as("CFC"),
            when($"CSP".isNotNull, maxTS($"CSP")).otherwise("0.000").as("CSP"),
            when($"RPM".isNotNull, maxTS($"RPM")).otherwise("0.000").as("RPM"))
          flat.foreachPartition { rows =>
            val kvOps = KeyValueOperations(ContainerAlias(inputContainerName), inputContainerCfg)
            rows.foreach { case Row(vin: String, uid: Long, cfc: String, csp: String, rpm: String) =>
              val vinData = Paths.get(outputCollectionBaseDir)
              val f = kvOps.findByKey(vinData, vin,  SomeColumns(List("WEATHER"))).map { r =>
                val origin = r.getFields
                origin.get("WEATHER").foreach { value =>
                  val counterMap = Map(cfc.substring(0, 3) -> Increment(1L))
                  kvOps.update(Paths.get(outputMetaBaseDir),
                    SimpleRow(value.toString, counterMap),
                    OverwriteMode.REPLACE)
                }
                val update = Map(
                  "T" -> uid,
                  "CFC" -> cfc,
                  "CSP" -> csp,
                  "RPM" -> rpm)
                val newRow = SimpleRow(vin, origin ++ update)
                kvOps.update(vinData, newRow,
                  OverwriteMode.REPLACE,
                  Or(Not(Exists("VIN")), LessThan("T", uid)))
              }
              f.recover { case _: FileNotFoundException =>
                log.warn(s"no matching record for $vin")
              }
              Await.result(f, Duration.Inf)
            }
          }
        } catch {
          case e: Exception =>
            log.error("Error while trying to process rdd", e)
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
}
