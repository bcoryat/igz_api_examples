(function () {
    'use strict';

    angular.module('iguazio.app')
        .directive('igzAllCars', igzAllCars);

    function igzAllCars() {
        return {
            restrict: 'A',
            scope: {
                cars: '=igzAllCars'
            },
            templateUrl: 'dashboard/dashboard-overview/all-cars/all-cars.tpl.html',
            bindToController: true,
            controller: IgzAllCarsController,
            controllerAs: 'allCars',
            replace: true
        };
    }

    function IgzAllCarsController(lodash, moment, ConfigService) {
        var vm = this;
        var weatherKeys = lodash.invert(ConfigService.weather);

        vm.showAlarmsOnly = false;
        vm.columnWidths = {
            vin: 20,
            t: 30,
            csp: 10,
            rpm: 10,
            cfc: 10,
            weather: 20
        };

        vm.filterCars = filterCars;
        vm.getDateString = getDateString;
        vm.hasAlarm = hasAlarm;

        activate();

        //////////

        //
        // Public methods
        //

        function getDateString(date) {
            return moment(date).format('YYYY-MM-DD HH:mm:ss');
        }

        /**
         * Tests whether or not car should be listed in All Cars list
         *
         * @param {Object} car - car to test
         * @returns {boolean} `true` if and only if the `car`'s region is in the selected regions list and either
         * "Bad weather alarm" filter is enabled and `car` has an alarm on or "Bad weather alarm" filter is disabled
         */
        function filterCars(car) {
            return !lodash.isEmpty(lodash.pick(car, ['csp', 'rpm', 'cfc'])) && (!vm.showAlarmsOnly || hasAlarm(car));
        }

        function hasAlarm(car) {
            var weather = weatherKeys[car.weather];
            return ['rainy', 'stormy', 'snowy'].includes(weather);
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         *
         * @private
         */
        function activate() {
        }
    }
}());
