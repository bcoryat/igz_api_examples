package openweathermap

import (
	"encoding/json"
	"fmt"
	"github.com/iguazio/weather/api"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

const (
	openWeatherMapURL         = "http://api.openweathermap.org/data/2.5"
	openWeatherMapForecastURI = "forecast"
	openWeatherAPIKeyKey      = "appid"
)

type openWeatherMap struct {
	apiKey string
}

type forecastResponse struct {
	List []struct {
		Time    int64 `json:"dt"`
		Weather []struct {
			Main        string `json:"main"`
			Description string `json:"description"`
		} `json:"weather"`
	} `json:"list"`
}

func (w *openWeatherMap) apiCall(query string, parser func([]byte) string) string {
	url := fmt.Sprintf("%s/%s?%s=%s&%s",
		openWeatherMapURL,
		openWeatherMapForecastURI,
		openWeatherAPIKeyKey,
		w.apiKey,
		query)
	log.Println("Calling api service", url)
	resp, err := http.Get(url)
	if err != nil {
		log.Fatal("Couldn't read api endpoint", url, err)
	}
	defer resp.Body.Close()
	read, _ := ioutil.ReadAll(resp.Body)
	return parser(read)
}

func (w *openWeatherMap) Category(latitude, longitude float64) string {
	query := fmt.Sprintf("lat=%f&lon=%f", latitude, longitude)
	return w.apiCall(query, func(body []byte) string {
		result := forecastResponse{}
		json.Unmarshal(body, &result)
		items := make([]api.CategoryItem, len(result.List), len(result.List))
		for index, item := range result.List {
			items[index] = api.CategoryItem{
				Timestamp: item.Time,
				Main:      strings.ToLower(item.Weather[0].Main),
				Detailed:  strings.ToLower(item.Weather[0].Description),
			}
		}
		response, err := json.Marshal(api.CategoryResponse{Items: items})
		if err != nil {
			log.Fatal("can't send response", err)
		}
		return string(response)
	})
}

func WeatherAPI(key string) api.Weather {
	return &openWeatherMap{apiKey: key}
}
