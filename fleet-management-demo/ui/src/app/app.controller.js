(function () {
    'use strict';

    angular.module('iguazio.app')
        .controller('AppController', AppController);

    function AppController($scope) {
        var vm = this;

        activate();

        function activate() {
            $scope.$on('$stateChangeSuccess', function (event, toState) {
                if (angular.isDefined(toState.data.pageTitle)) {
                    vm.pageTitle = 'Fleet Management';
                }
            });
        }
    }
}());
