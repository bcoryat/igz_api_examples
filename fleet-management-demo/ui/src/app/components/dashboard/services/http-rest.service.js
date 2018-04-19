(function () {
    'use strict';

    angular.module('iguazio.app')
        .factory('HttpRestService', HttpRestService);

    function HttpRestService($http, lodash, moment, ConfigService) {
        var weatherKeys = lodash.invert(ConfigService.weather);

        return {
            getTrucks: getTrucks,
            getHistogram: getHistogram
        };

        //////////

        //
        // Public methods
        //

        /**
         * Gets data-points for populating the heat-map and weather overlays of the map
         * @returns {Promise.<Array>} promise resolving to an array of trucks
         */
        function getTrucks() {
            return fetchAll(ConfigService.trucksTable, 'VIN,T,LAT,LON,WEATHER,CSP,RPM,CFC,__mtime_secs').then(function (trucks) {
                return lodash.map(trucks, function (truck) {
                    return angular.extend(truck, {
                        timestamp: moment(truck.t, 'YYYYMMDDHHmmssSSS').toDate(),
                        modified: new Date(truck.mtimeSecs * 1000),
                        iconName: weatherKeys[truck.weather]
                    });
                });
            });
        }

        /**
         * Gets data-points for populating the histogram
         * @returns {Promise.<Array>} promise resolving to an array of trucks
         */
        function getHistogram() {
            return fetchAll(ConfigService.histogramTable).then(function (categories) {
                return lodash.map(categories, function (category) {
                    return {
                        name: category.name,
                        data: lodash.pickBy(category, function (attribute, key) {
                            return /^\d+\.?\d+$/g.test(key); // i.e. math keys in the form: 0.0, 0.2, 6.5, etc…
                        })
                    };
                });
            });
        }

        //
        // Private methods
        //

        /**
         * Fetches all trucks from back-end
         * Recursively fetching all elements across nginx's "pages"
         * @param {string} table - the table from which to retrieve records
         * @param {string} [attributesToGet] - if provided, filters attributes described in this comma-separated list
         * @param {string} [marker] - if provided, the contents will start from this marker
         * @returns {Promise.<Array>} a promise resolving to an array of trucks
         */
        function fetchAll(table, attributesToGet, marker) {
            var config = {
                headers: {
                    'Content-type': 'application/json',
                    'X-v3io-function': 'GetItems',
                    'Cache-Control': 'no-cache'
                }
            };

            var body = {
                AttributesToGet: attributesToGet || '**'
            };

            if (angular.isDefined(marker)) {
                body.Marker = marker;
            }

            return $http.post(ConfigService.baseUrl + '/' + table + '/', body, config)
                .then(function (response) {
                    var nextMarker = response.data.NextMarker;
                    var elements = lodash.map(response.data.Items, transform);
                    var done = response.data.LastItemIncluded === 'TRUE';

                    // no more elements to fetch - return current elements
                    if (done) {
                        return elements;
                    }

                    // more elements to fetch - fetch them
                    return fetchAll(table, attributesToGet, nextMarker).then(function (moreElements) {

                        // concat fetched elements to current elements and return them all
                        return elements.concat(moreElements);
                    });
                });
        }

        /**
         * Transforms an EMD item from back-end to a nice plain JavaScript object.
         *
         * 1. Converts key strings case (snake to camel):
         *    Back-end uses snake-case for key strings.
         *    These are converted to camel-case.
         *
         *    For example: 'num_cars_w_alarm' is converted to 'numCarsWAlarm'
         *
         * 2. Converts value strings representing literals of Date, number or boolean types.
         *    Back-end represents dates, floats and booleans as strings.
         *    These are converted to a real value of the appropriate type.
         *
         *    For example:
         *    - the string '2016-09-25T15:08:53.687Z' is converted to a Date object representing this date
         *    - the string '005348.123e-15' is converted to the pure numeric value 5348.123e-15
         *    - the string 'true' is converted to the pure boolean value true, and 'false' to false
         *
         * @private
         * @param {Object} item - the item to transform
         * @returns {*} the transformed object (if a non-object value is provided it is returned as-is)
         * @example
         *
         *     before:
         *     {
         *         'id'       : { N:    '43'                       },
         *         'fuel_left': { S:    '2.456'                    },
         *         'alarm'    : { BOOL: 'true'                     },
         *         'timestamp': { S:    '2016-09-25T15:08:53.687Z' }
         *     }
         *
         *     after:
         *     {
         *         'id'       : 43,
         *         'fuelLeft' : 2.456,
         *         'alarm'    : true,
         *         'timestamp': Date object (representing the date September 25, 2016 15:08:53.687 UTC timezone)
         *     }
         *
         */
        function transform(item) {
            return lodash.transform(item, function (result, value, key) {

                /* then value is of this format:
                 * { N: '1234' } or { S: '23.258' } or { BOOL: 'true' }
                 * hence its first (and only) value needs to be retrieved
                 */
                var newValue = parseStrings(lodash(value).values().first());
                var newKey = /^\d+\.?\d+$/g.test(key) ? key : lodash.camelCase(key);
                result[newKey] = newValue;
            }, {});

            /**
             * Parses a provided string to a primitive value according to the following rules:
             * - The strings 'true' and 'false' are converted to the corresponding boolean value
             * - A string that represents a numeric literal (e.g. '-52.0130e-08') is converted to the corresponding
             * number value
             * - A string in the ISO-8601 date format (e.g. '2016-01-08T05:08:09.001+05:30') is converted to a
             *   corresponding Date object representing that time and date
             * - Any other string is not converted and returned as-is
             *
             * @private
             * @param {string} value - the string to parse
             * @returns {string|Date|boolean|number} the primitive value
             */
            function parseStrings(value) {
                var regexIso8601 = /^(\d{4})-(0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d+(?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d|Z)$/;
                var regexNumeric = /^[+-]?\d+(\.\d*)?([Ee][+-]?\d+)?$/;
                var regexBoolean = /^true|false$/;

                return regexIso8601.test(value) ? new Date(value)  : // parse string as date
                       regexNumeric.test(value) ? Number(value)    : // parse string as number
                       regexBoolean.test(value) ? value === 'true' : // parse string as boolean
                                                  value;             // return value as-is
            }
        }
    }
}());
