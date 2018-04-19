package location

import (
	"fmt"
	"github.com/mmcloughlin/geohash"
	"strconv"
	"strings"
)

func parse(latlon string) (float64, float64, error) {
	coords := strings.Split(latlon, ",")
	if len(coords) != 2 {
		return 0.0, 0.0, fmt.Errorf("Bad latitude,longitude format (provided %s)", latlon)
	}
	lat, e := strconv.ParseFloat(coords[0], 64)
	if e != nil {
		return 0.0, 0.0, fmt.Errorf("Bad format for latitude (provided: %s)", coords[0])
	}
	lon, e := strconv.ParseFloat(coords[1], 64)
	if e != nil {
		return 0.0, 0.0, fmt.Errorf("Bad format for longitude (provided: %s)", coords[1])
	}
	return lat, lon, nil
}

func hashDecode(hash string) (float64, float64) {
	return geohash.Decode(hash)
}

func ParseLatitudeLongitude(coordsOrHash string) (float64, float64) {
	lat, lon, err := parse(coordsOrHash)
	if err != nil {
		lat, lon = hashDecode(coordsOrHash)
	}
	return lat, lon
}
