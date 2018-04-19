FROM alpine

WORKDIR /app

ENV GIN_MODE release

ADD weather-proxy /app

EXPOSE 9999 

ENTRYPOINT ["./weather-proxy", "-nginx-url", "10.90.1.102:8081",  "-weather-service-url",  "localhost:9000"]