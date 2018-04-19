package main

import (
	"flag"
	"fmt"
	"github.com/iguazio/location"
	"github.com/iguazio/weather/api/openweathermap"
	"gopkg.in/gin-gonic/gin.v1"
	"os"
)

func main() {
	port := flag.Int64("port", 9000, "Listen on port (default: 9000)")
	key := flag.String("key", "", "API key for OpenWeatherMap service")
	flag.Parse()
	if *key == "" {
		flag.Usage = func() {
			fmt.Println("in usage")
			fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
		}
		flag.PrintDefaults()
		return
	}

	router := gin.Default()

	api := openweathermap.WeatherAPI(*key)
	router.GET("/weather/category/:coords", func(c *gin.Context) {
		lat, lon := location.ParseLatitudeLongitude(c.Param("coords"))
		c.String(200, api.Category(lat, lon))
	})

	router.Run(fmt.Sprintf(":%d", *port))
}
