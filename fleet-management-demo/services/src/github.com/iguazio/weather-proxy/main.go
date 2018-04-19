package main

import (
	"flag"
	"fmt"
	"log"
	"time"
	"github.com/iguazio/location"
	"github.com/iguazio/weather-proxy/store"
	"gopkg.in/gin-gonic/gin.v1"
	"os"
)

func main() {
	port := flag.Int64("port", 9999, "Listen on port (default: 9999)")
	nginx := flag.String("nginx-url", "", "iguazio nginx URL")
	container := flag.String("container-name", "bigdata", "container name")
	weatherServiceURL := flag.String("weather-service-url", "", "Weather API service URL")
	flag.Parse()
	if *nginx == "" || *weatherServiceURL == "" {
		flag.Usage = func() {
			fmt.Println("in usage")
			fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
		}
		flag.PrintDefaults()
		return
	}

	router := gin.Default()

	s, err:= store.NewMetaStore(*nginx, *container, *weatherServiceURL)
	if (err) != nil {
		fmt.Println(fmt.Errorf("%v",err))
	}

	router.GET("/weather-proxy/:coords", func(c *gin.Context) {
		lat, lon := location.ParseLatitudeLongitude(c.Param("coords"))
		var timestamp time.Time
		timeQuery := c.Query("time")
		if timeQuery == "" {
			timestamp = time.Now()
		} else {
			// this is intended - we ignore the real timestamp
			timestamp = time.Now()
		}
		log.Printf("Got request for %f,%f with time %s (actual: %d)", lat, lon, timeQuery, timestamp)
		createStr, err := s.GetOrCreate(lat, lon, timestamp)
		if (err) != nil {
			fmt.Println(fmt.Errorf("%v",err))
			c.String(500, "error occured")
			return
		}
		c.String(200, createStr)
		})
	router.Run(fmt.Sprintf(":%d", *port))
}
