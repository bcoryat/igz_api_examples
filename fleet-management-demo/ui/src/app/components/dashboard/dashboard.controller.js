(function () {
    'use strict';
    angular.module('iguazio.app')
        .controller('DashboardController', DashboardController);

    function DashboardController($interval, $scope, $q, lodash) {
        var vm = this;

        vm.intervals = [];
        vm.timeoutDeferred = $q.defer();

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

            // on destroy of this controller - cancel polling
            $scope.$on('$destroy', terminatePolling);
        }

        /**
         * Terminates all polling of data initiated by this controller and its descendants (child directives)
         *
         * @private
         */
        function terminatePolling() {
            angular.forEach(vm.intervals, $interval.cancel);
            lodash.fill(vm.intervals, null);
            vm.intervals.splice(0);
        }
    }
}());
