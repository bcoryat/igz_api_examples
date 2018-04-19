#!/usr/bin/env bash

set -x

NGINX=10.90.1.102
CONTAINER_ID=1

curl -X POST \
    -H 'X-v3io-function:CreateStream' \
    -H 'Content-type: application/json' \
    -d '{"ShardCount":12, "RetentionPeriodHours":1}' \
    http://$NGINX:8081/$CONTAINER_ID/vin/gps/
    
curl -X POST \
    -H 'X-v3io-function:CreateStream' \
    -H 'Content-Type: application/json' \
    -d '{"ShardCount":12, "RetentionPeriodHours":1}' \
    http://$NGINX:8081/$CONTAINER_ID/vin/events/

curl -X POST \
    -H 'X-v3io-function:DescribeStream' \
    -H 'Content-Type: application/json' \
    http://$NGINX:8081/$CONTAINER_ID/vin/gps/

curl -X POST \
    -H 'X-v3io-function:DescribeStream' \
    -H 'Content-Type: application/json' \
    http://$NGINX:8081/$CONTAINER_ID/vin/events/


