#!/usr/bin/env bash

RUN_CMD=${RUN_CMD:-/bin/bash}
BLASTER_SCRIPT_FOLDER="${HOME}/fleet-management-demo/producer"

SPARK_JOBS_FOLDER="${HOME}/fleet-management-demo/consumer/sbin"

function cleanup_hadoop {
    ${RUN_CMD} hadoop fs -rm -R /vin/data
    ${RUN_CMD} hadoop fs -rm -R /vin/meta
}

while true; do
    cleanup_hadoop
    jps | grep -i sparksubmit | cut -f1 -d" " | xargs kill -9
    pushd ${SPARK_JOBS_FOLDER}
    ${RUN_CMD} ./weather_correlation.sh
    sleep 10s
    ${RUN_CMD} ./metrics_update.sh
    sleep 10s
    popd
    pushd ${BLASTER_SCRIPT_FOLDER}
    ${RUN_CMD} ./run_blaster.sh
    sleep 10s
    cleanup_hadoop
    jps | grep -i sparksubmit | cut -f1 -d" " | xargs kill -9
    popd
done

