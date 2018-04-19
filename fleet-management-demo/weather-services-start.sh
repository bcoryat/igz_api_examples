#!/usr/bin/env bash

cd /home/iguazio/fleet-management-demo/services/weather
nohup ./weather -key 76a0c1943f58f05fa34bed24e181ec65  > /dev/null 2>&1 & echo $! > weather.pid  

cd /home/iguazio/fleet-management-demo/services/weather-proxy 
nohup ./weather-proxy -nginx-url localhost:8081 -weather-service-url localhost:9000  > /dev/null 2>&1 & echo $! > weather-proxy.pid

echo "weather services started"
exit 0 

