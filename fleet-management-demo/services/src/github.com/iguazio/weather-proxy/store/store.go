package store

import (
	"fmt"
	"log"
	"time"
	"encoding/json"
	"github.com/mmcloughlin/geohash"
	"github.com/nuclio/logger"
	"github.com/nuclio/zap"
	"github.com/pkg/errors"
	"github.com/v3io/v3io-go-http"
	"net/http"
	"io/ioutil"
)


const (
	weatherMetaData = "meta/weather"
	weatherApiURI   = "weather/category"
)


type weatherResponse struct {
	Items []struct {
		Timestamp int64  `json:"timestamp"`
		Main      string `json:"main"`
		Detailed  string `json:"detailed"`
	} `json:"items"`
}

type igzWeatherResponse struct {
	Detailed struct {
		S string `json:"S"`
	} `json:"detailed"`
	Main struct {
		S string `json:"S"`
	} `json:"main"`
}

type Store struct {
	container  *v3io.Container
	weatherApi string
}


func (s *Store) createMetaTable() {
	putObj := v3io.PutObjectInput{Path: fmt.Sprintf("%s/tag", weatherMetaData), Body: []byte{}}
	responseChan := make(chan *v3io.Response, 3)
	_, err := s.container.PutObject(&putObj, responseChan)
	if err != nil {
		errors.Wrap(err, "error sending request")
		return
	}
	res := <-responseChan
	if (res.Error) != nil {
		errors.Wrap(res.Error, "error with response")
		return
	}
}


func (s *Store) GetOrCreate(latitude, longitude float64, timestamp time.Time) (string, error) {
	return s.GetOrCreateWithGeoHash(geohash.EncodeWithPrecision(latitude, longitude, 4), timestamp)
}


func (s *Store) GetOrCreateWithGeoHash(hash string, timestamp time.Time) (string, error) {
	filter := fmt.Sprintf("starts(__name,'%s') and __name >= '%s.%s'", hash, hash, timestamp.Format("2006010215"))
	attributes := []string{"main", "detailed"}
	path := fmt.Sprintf("%s/", weatherMetaData)
	getItemsInput := v3io.GetItemsInput{Path: path, AttributeNames: attributes, Filter: filter, Limit:1}
	responseChan := make(chan *v3io.Response, 5)

	_, err := s.container.GetItems(&getItemsInput, responseChan)
	if err != nil {
		return "", errors.Wrap(err, "unable to send GetItems request")
	}
	res := <-responseChan
	if (res.Error) != nil {
		errors.Wrap(res.Error, "error with response")
		return "", res.Error
	}
	body := res.Body()
	var getItemsOutput v3io.GetItemsOutput
	json.Unmarshal(body, &getItemsOutput)
	if len(getItemsOutput.Items) == 0  {
		log.Println("getItems==0, creating cache entries")
		createdStr, err := s.Create(hash)
		if err != nil {
			return "", err
		}
		return createdStr, nil
	}
	log.Println("getItems>0, returning latest from cache")
	latestJson, _ := json.Marshal(getItemsOutput.Items[0])
	str := transformResponse(&latestJson)
	return str, nil
}


func  transformResponse(weatherJson *[]byte) (string) {
	var igzWeather igzWeatherResponse
	json.Unmarshal(*weatherJson, &igzWeather)
	jsonStr := fmt.Sprintf("{\"main\":\"%s\", \"detailed\":\"%s\"}", igzWeather.Main.S, igzWeather.Detailed.S)
	return jsonStr
}


func (s *Store) Create(hash string) (string, error) {
	weatherApiStr := fmt.Sprintf("http://%s/%s/%s", s.weatherApi, weatherApiURI, hash)
	resp, err := http.Get(weatherApiStr)
	fmt.Println("weather api string is:" +weatherApiStr)
	if err != nil {
		//fmt.Println(fmt.Errorf("log error here %v",err))
		return "", errors.Wrap(err, "Unable to access weather API at " + s.weatherApi)
	}
	defer resp.Body.Close()
	weather, err := readWeatherAPIResult(resp)
	if err != nil {
		return "",errors.Wrap(err, "Unable to read weather API response")
	}
	var latest map[string]interface{}
	for _, item := range weather.Items {
		path := fmt.Sprintf("%s/%s.%s", weatherMetaData, hash, time.Unix(item.Timestamp, 0).Format("2006010215"))
		fmt.Println(path)
		latest = map[string]interface{}{"main": item.Main, "detailed": item.Detailed}
		putItemInput := v3io.PutItemInput{Path:path,Attributes:latest}
		responseChan := make(chan *v3io.Response, 5)
		_, err := s.container.PutItem(&putItemInput, responseChan)
		if err != nil {
			errors.Wrap(err, "unable to send PutItem request")
			return "", err
		}
		res := <-responseChan
		if (res.Error) != nil {
			errors.Wrap(res.Error, "error with response")
			return "", res.Error
		}
	}
	latestJson, _ := json.Marshal(latest)
	return string(latestJson[:]), nil
}


func readWeatherAPIResult(resp *http.Response) (weatherResponse, error) {
	var weather weatherResponse

	if resp.StatusCode != 200 {
		return weather, errors.New("can access weather api non 200 response")
	}
	bodyBytes, err := ioutil.ReadAll(resp.Body)
	//bodyString := string(bodyBytes)
	json.Unmarshal(bodyBytes, &weather)

	return weather,err
}


func NewMetaStore(igzNginx string, containerName string, weatherApi string ) (*Store, error) {
	zlogger, err := nucliozap.NewNuclioZapCmd("weatherProxy", nucliozap.DebugLevel)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to create logger")
	}

	container, err:= newContainer(zlogger, igzNginx, containerName)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to create container")
	}
	s := Store{container, weatherApi }
	s.createMetaTable()
	return &s, nil
}


func newContainer(logger logger.Logger, igzNginx, containerName string) (*v3io.Container, error) {
	context, err := v3io.NewContext(logger, igzNginx, 8)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to create client")
	}
	session, err := context.NewSession("iguazio", "iguazio", "igzstore")
	if err != nil {
		return nil, errors.Wrap(err, "Failed to create session")
	}
	container, err := session.NewContainer(containerName)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to create container")
	}
	return container, nil
}
