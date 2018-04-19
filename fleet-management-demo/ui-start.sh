#!/usr/bin/env bash

cd /home/iguazio/fleet-management-demo/ui
export IGZ_FLEET_LISTEN_PORT=4500
nohup gulp  > /dev/null 2>&1 & echo $! > ui.pid  
echo "UI started"
exit 0 
