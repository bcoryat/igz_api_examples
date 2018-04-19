#!/usr/bin/env bash
set -x

BASEDIR=`readlink -f $(dirname "$0")`/..
echo "Base-dir: $BASEDIR"




CONFIG_DIR=$BASEDIR/conf
LIBS_DIR=$BASEDIR/lib
OUTPUT_FILE=$BASEDIR/metrics.log

nohup \
spark-submit \
--master yarn \
--deploy-mode client \
--num-executors 12 \
--jars $LIBS_DIR/geohash-1.3.0.jar,$LIBS_DIR/config-1.2.1.jar,/home/iguazio/igz/bigdata/libs/v3io-hcfs_2.11.jar,/home/iguazio/igz/bigdata/libs/v3io-spark2-object-dataframe_2.11.jar,/home/iguazio/igz/bigdata/libs/v3io-spark2-streaming_2.11.jar \
--files $CONFIG_DIR/metrics-update.conf \
--conf "spark.executor.extraJavaOptions= \
    -Dconfig.resource=metrics-update.conf \
    -Dv3io.config.kv.update.max-in-flight=128" \
--conf "spark.driver.extraJavaOptions= \
    -Dconfig.file=$CONFIG_DIR/metrics-update.conf" \
--conf "spark.sql.shuffle.partitions=12" \
--conf "spark.streaming.backpressure.enabled=True" \
--conf "spark.executor.memory=2048m" \
--conf "spark.streaming.v3io.maxRatePerPartition=20000" \
--class demo.MetricsUpdate \
$LIBS_DIR/fleet-management_2.11-1.0.jar >$OUTPUT_FILE 2>&1 < /dev/null &

echo "Done!"

