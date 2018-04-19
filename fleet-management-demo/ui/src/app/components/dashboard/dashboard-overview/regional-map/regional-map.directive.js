(function () {
    'use strict';

    angular.module('iguazio.app')
        .directive('igzRegionalMap', igzRegionalMap);

    function igzRegionalMap() {
        return {
            restrict: 'A',
            scope: {
                trucks: '=igzRegionalMap'
            },
            replace: true,
            templateUrl: 'dashboard/dashboard-overview/regional-map/regional-map.tpl.html',
            bindToController: true,
            controller: IgzRegionalMapController,
            controllerAs: 'regionalMap'
        };
    }

    function IgzRegionalMapController($scope, leafletData, lodash, ConfigService) {
        var vm = this;

        angular.extend(vm, {
            center: {
                lat: 36.554039,
                lng: 139.179084,
                zoom: 10
            },
            layers: {
                baselayers: {
                    crt: {
                        name: 'Carto',
                        url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                        type: 'xyz',
                        layerOptions: {
                            minZoom: 9,
                            maxZoom: 12
                        }
                    }
                },
                overlays: {
                    heat: {
                        name: 'Heat Map',
                        type: 'heat',
                        data: [],
                        layerOptions: {
                            radius: ConfigService.heatmap.radius,
                            blur: ConfigService.heatmap.blur,
                            max: 1.0
                        },
                        visible: true
                    },
                    weather: {
                        name: 'Weather',
                        type: 'group',
                        visible: true
                    }
                }
            },
            markers: {}
        });

        activate();

        //////////

        //
        // Private methods
        //

        function activate() {
            $scope.$watch(function () {
                return vm.trucks;
            }, function () {
                refreshData();
            });

            // on zoom change - update icons' size and image according to needed resolution
            $scope.$watch(function () {
                return vm.center.zoom;
            }, function () {
                angular.forEach(vm.markers, function (marker) {
                    var res = getResolutionByZoom();
                    angular.extend(marker.icon, {
                        iconSize: [res, res],
                        iconUrl: marker.icon.iconUrl.replace(/\d+(?=\.png)/, res)
                    });
                });
            });
        }

        function refreshData() {

            // get Leaflet map object from view
            leafletData.getMap().then(function (map) {
                var points = [];
                var markerId = 0;
                vm.markers = {};
                angular.forEach(vm.trucks, function (truck) {
                    addMarker('m' + markerId, truck.lat, truck.lon, truck.weather, truck.iconName);
                    points.push([truck.lat, truck.lon]);
                    markerId += 1;
                });

                // find the heat-map overlay layer
                var heatMapOverlayLayer = lodash.find(map._layers, '_heat');

                // if it was found - redraw it with new data-points
                if (angular.isDefined(heatMapOverlayLayer)) {
                    heatMapOverlayLayer.setLatLngs(points);
                    heatMapOverlayLayer.redraw();
                }
            });
        }

        function addMarker(key, lat, lng, weather, iconName) {
            var res = getResolutionByZoom();

            // shift weather icon a little bit away from the truck's position, so they won't be displayed exaclty one on
            // top of the other
            var markerPosition = {
                lat: lat + 0.05,
                lng: lng + 0.05
            };

            // add weather icon only if there's any other one in some radius
            if (!lodash.some(vm.markers, isInRadius)) {
                vm.markers[key] = {
                    layer: 'weather',
                    lat: markerPosition.lat,
                    lng: markerPosition.lng,
                    focus: false,
                    draggable: false,
                    riseOnHover: true,
                    title: lodash.capitalize(weather),
                    icon: {
                        iconSize: [res, res],
                        iconUrl: '/assets/images/icons/' + iconName + '-stroke-' + res + '.png'
                    }
                };
            }

            function isInRadius(marker) {
                return Math.pow(marker.lat - markerPosition.lat, 2) + Math.pow(marker.lng - markerPosition.lng, 2) < 0.008;
            }
        }

        function getResolutionByZoom() {
            var zoom = vm.center.zoom;
            return (zoom < 8)  ? 16 :
                   (zoom < 11) ? 32 :
                                 48;
        }
    }
}());
