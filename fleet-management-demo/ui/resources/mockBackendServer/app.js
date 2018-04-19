var _ = require('lodash');
var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var moment = require('moment');

// settings
var TRUCK_COUNT = 400;
var SPEED_MAX = 250;
var RPM_MAX = 500;
var MAX_FUEL_CONSUMPTION = 100;
var WEATHER_STATES = ['clear', 'clouds', 'rain', 'snow', 'storm'];
var LAT_CENTER = 36.554039;
var LNG_CENTER = 139.179084;
var LAT_VARIATION_MAX = 0.25;
var LNG_VARIATION_MAX = 0.35;
var SERIES_NAMES = _.map(_.range(0.0, 10.0, 0.1), function (n) {
    return n.toFixed(1);
});
var MIN_SERIES_IN_CATEGORY = 3;
var MAX_SERIES_IN_CATEGORY = 10;
var MAX_SERIES_VALUE = 100;
var MIN_CATEGORIES = 1;

var app = express();

var getTrucks = function (request, response) {
    var trucks = _.times(TRUCK_COUNT, function (truckId) {
       return {
           __mtime_secs: { S: Math.floor(Date.now() / 1000) },
           VIN:          { S: 'T' + truckId },
           T:            { S: moment().format('YYYYMMDDHHmmssSSS') },
           LAT:          { N: String(LAT_CENTER + _.random(-LAT_VARIATION_MAX, LAT_VARIATION_MAX, true)) },
           LON:          { N: String(LNG_CENTER + _.random(-LNG_VARIATION_MAX, LNG_VARIATION_MAX, true)) },
           CSP:          { N: String(_.random(0, SPEED_MAX, true)) },
           RPM:          { N: String(_.random(0, RPM_MAX, false)) },
           CFC:          { N: String(_.random(0, MAX_FUEL_CONSUMPTION, true)) },
           WEATHER:      { S: _.sample(WEATHER_STATES) }
       };
    });
    var data = {
        LastItemIncluded: 'TRUE',
        NumItems: trucks.length,
        Items: trucks
    };
    response.status(200).send(data);
};

var getHistogram = function (request, response) {
    var categories = _.sampleSize(WEATHER_STATES, _.random(MIN_CATEGORIES, WEATHER_STATES.length, false));
    var series = _.sampleSize(SERIES_NAMES, _.random(MIN_SERIES_IN_CATEGORY, MAX_SERIES_IN_CATEGORY, false));
    var items = _.map(categories, function (category) {
        var result = {
            __name: { S: category }
        };

        _.forEach(series, function (seriesName) {
            result[seriesName] = { N: String(_.random(0, MAX_SERIES_VALUE, false)) };
        });

        return result;
    });
    var data = {
        LastItemIncluded: 'TRUE',
        NumItems: categories.length,
        Items: items
    };
    response.status(200).send(data);
};

app.use(cors({
    'origin': function (origin, callback) {
        callback(null, true);
    },
    'credentials': true
}));
app.use(bodyParser.json({limit: '15mb'}));
app.use(bodyParser.urlencoded({limit: '15mb', extended: true}));
app.use(bodyParser.json());
app.put('/1/vin/data', getTrucks);
app.post('/1/vin/data', getTrucks);
app.put('/1/vin/meta', getHistogram);
app.post('/1/vin/meta', getHistogram);
app.all('/*', function (request, response) {
    response.status(403).send('Invalid endpoint');
});

module.exports = function (log) {
    var backendPort = process.env.IGZ_MOCK_BACKEND_LISTEN_PORT || 8081;

    app.listen(backendPort, function () {
        log('Mock backend api listening on ' + backendPort);
    });
};

// activate this module if it wasn't `require`-ed, but it got running from command-line or IDE
if (!module.parent) {
    module.exports(require('gulp-util').log);
}