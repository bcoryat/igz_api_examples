(function () {
    'use strict';

    angular.module('iguazio.app')
        .run(appInit);

    function appInit($rootScope, $state) {
        $rootScope.$state = $state;

        /*eslint angular/on-watch: 0*/
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            $state.go(toState.name, toParams || {}, {'notify': false}).then(function (state) {
                $rootScope.$broadcast('$stateChangeSuccess', state, toParams);
            });
        });
    }
}());
