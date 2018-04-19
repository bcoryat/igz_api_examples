(function () {
    'use strict';

    angular.module('iguazio.app')
        .directive('igzCarsAlarmsChart', igzCarsAlarmsChart);

    function igzCarsAlarmsChart() {
        return {
            restrict: 'A',
            scope: {},
            templateUrl: 'dashboard/dashboard-overview/cars-alarms-chart/cars-alarms-chart.tpl.html',
            bindToController: true,
            controller: IgzCarsAlarmsChartController,
            controllerAs: 'carsAlarmsChart',
            replace: true
        };
    }

    function IgzCarsAlarmsChartController($scope, $timeout, lodash, ConfigService, HttpRestService) {
        var vm = this;
        var timeout = null;
        var weatherKeys = lodash.invert(ConfigService.weather);

        vm.chart = null;
        vm.chartConfig = {};
        vm.refreshChart = refreshChart;

        activate();

        //////////

        //
        // Public methods
        //

        function refreshChart() {
            timeout = null;

            if (vm.chart !== null) {
                vm.chart.showLoading();
            }

            HttpRestService.getHistogram()
                .then(function (categories) {
                    vm.categories = categories;
                    vm.chart.hideLoading();
                })
                .catch(function () {
                    if (timeout === null) {
                        if (vm.chart !== null) {
                            vm.chart.showLoading('Error occurred while requesting data from server.');
                        }
                        timeout = $timeout(refreshChart, ConfigService.refreshDelay);
                    }
                });
        }

        //
        // Private methods
        //

        /**
         * Set charts configs after data has been received from server
         *
         * @private
         */
        function setChartsConfigs() {
            vm.chartConfig = {
                options: {
                    colors: [
                        'hsl(0,   40%, 40%)',
                        'hsl(72,  40%, 40%)',
                        'hsl(144, 40%, 40%)',
                        'hsl(216, 40%, 40%)',
                        'hsl(288, 40%, 40%)',
                        'hsl(0,   20%, 70%)',
                        'hsl(72,  20%, 70%)',
                        'hsl(144, 20%, 70%)',
                        'hsl(216, 20%, 70%)',
                        'hsl(288, 20%, 70%)'
                    ],
                    chart: {
                        type: 'bar',
                        backgroundColor: 'transparent',
                        height: null, // calculate height from the offset height of the containing element
                        margin: [0, undefined, 45, undefined], // [top, right, bottom, left]; undefined means automatic
                        spacing: [0, 5, 20, 0],
                        style: {
                            overflow: 'visible!important'
                        }
                    },
                    loading: {
                        labelStyle: {
                            color: 'white',
                            opacity: 1
                        },
                        style: {
                            backgroundColor: 'gray',
                            opacity: 0.8
                        }
                    },
                    title: {
                        text: '',
                        floating: true,
                        style: {
                            'font-family': 'Raleway, sans-serif',
                            color: '#5982a2',
                            display: 'none'
                        }
                    },
                    exporting: {
                        enabled: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(245,245,245,0.90)',
                        borderColor: '#444',
                        borderWidth: 2,
                        borderRadius: 5,
                        shadow: false,
                        style: {
                            fontWeight: 900,
                            fontSize: '12px'
                        },
                        formatter: function () {
                            return this.point.percentage.toFixed(1) + '%';
                        },
                        useHTML: false
                    },
                    legend: {
                        enabled: true,
                        align: 'left',
                        verticalAlign: 'top',
                        layout: 'vertical',
                        floating: false,
                        padding: 5,
                        itemMarginTop: 0,
                        itemMarginBottom: 5
                    },
                    xAxis: {
                        lineWidth: 1,
                        tickLength: 0,
                        tickWidth: 0,
                        type: 'category',
                        // categories: ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'],
                        labels: {
                            style: {
                                fontFamily: 'Open Sans',
                                fontSize: '12px',
                                color: '#5982a2'
                            },
                            y: -2,
                            autoRotation: 0,
                            useHTML: true,
                            formatter: function () {
                                var value = this.value;
                                return '<span style="width: 30px;">' + value + '</span> ' +
                                    '<img src="/assets/images/icons/' + weatherKeys[value] + '.png" ' +
                                    'alt="' + value + '" title="' + value + '" ' +
                                    'style="vertical-align: middle; width: 32px; height: 32px"/>';
                            }
                        }
                    },
                    yAxis: {
                        endOnTick: true,
                        startOnTick: true,
                        min: 0,
                        max: 100,
                        tickInterval: 20,
                        labels: {
                            enabled: true,
                            format: '{value}%'
                        },
                        gridLineColor: '#ebebeb',
                        reversedStacks: false,
                        title: {
                            text: ''
                        }
                    },
                    plotOptions: {
                        bar: {
                            borderRadius: 3
                        },
                        series: {
                            borderWidth: 1,
                            pointPadding: 0.01,
                            stacking: 'percent',
                            dataLabels: {
                                enabled: true,
                                y: 0,
                                overflow: 'none',
                                style: {
                                    fontFamily: 'Open Sans',
                                    fontSize: '100%',
                                    fontWeight: 900,
                                    letterSpacing: '0.15em',
                                    textShadow: false,
                                    textOutline: 'none'
                                },
                                formatter: function () {
                                    var percentage = this.percentage.toFixed(1) + '%';
                                    var absolute = this.y;
                                    return (absolute < 5) ? '' : percentage;
                                }
                            },
                            showInLegend: true
                        }
                    },
                    credits: {
                        enabled: false
                    }
                },
                series: [],
                func: function (chart) {
                    vm.chart = chart;
                }
            };
        }

        /**
         * Constructor method
         *
         * @private
         */
        function activate() {
            setChartsConfigs();

            $scope.$watch(function () {
                return vm.categories;
            }, function () {
                vm.chartConfig.series = prepareSeries(vm.categories);
                vm.chartConfig.options.xAxis.categories = lodash.map(vm.categories, 'name');
            });

            $scope.$on('$destroy', function () {
                if (timeout !== null) {
                    $timeout.cancel(timeout);
                }
                timeout = null;
            });

            refreshChart();
        }

        function prepareSeries() {
            return lodash.chain(vm.categories)
                .transform(function (seriesObject, category) {
                    angular.forEach(category.data, function (value, seriesName) {
                        if (!angular.isArray(seriesObject[seriesName])) {
                            seriesObject[seriesName] = [];
                        }
                        seriesObject[seriesName].push({
                            y: value,
                            name: category.name
                        });
                    });
                }, {})
                .transform(function (seriesArray, seriesData, seriesName) {
                    seriesArray.push({
                        name: seriesName,
                        data: seriesData,
                        color: vm.chartConfig.options.colors[seriesArray.length]
                    });
                }, [])
                .orderBy(['name'], ['asc'])
                .value();
        }
    }
}());
