name := "fleet-management"

version := "1.0"

scalaVersion := "2.11.11"

fork := true

val sparkVersion = "2.1.1"

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion,
  "org.apache.spark" %% "spark-sql" % sparkVersion,
  "org.apache.spark" %% "spark-streaming" % sparkVersion,
  "com.typesafe" % "config" % "1.2.1",
  "org.scalaj" % "scalaj-http_2.11" % "2.3.0",
  "ch.hsr" % "geohash" % "1.3.0"
)
