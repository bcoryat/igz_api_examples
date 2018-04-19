(function () {
    'use strict';

    angular.module('iguazio.app')
        .controller('DashboardOverviewController', DashboardOverviewController);

    function DashboardOverviewController($timeout, $scope, lodash, ConfigService, HttpRestService) {
        var vm = this;
        var timeout = null;

        angular.extend(vm, {
            message: 'loading…',
            loader: true,
            trucks: []
        });

        activate();

        //////////

        //
        // Private methods
        //

        /**
         * Constructor method
         *
         * @private
         */
        function activate() {
            refreshData();


            $scope.$on('$destroy', function () {
                if (timeout !== null) {
                    $timeout.cancel(timeout);
                }
                timeout = null;
            });
        }

        function refreshData() {
            timeout = null;
            HttpRestService.getTrucks().then(function (trucks) {
                if (!lodash.isEmpty(trucks)) {
                    vm.trucks = trucks;
                }
                vm.loader = false;
            }).catch(function () {
                if (vm.loader) {
                    vm.message = 'Error occurred while requesting data from server.'
                }
            }).finally(function () {
                requestPeriodically();
            });
        }

        function requestPeriodically() {
            vm.message = 'loading…';
            if (timeout === null) {
                timeout = $timeout(refreshData, ConfigService.refreshDelay);
            }
        }
    }
}());
