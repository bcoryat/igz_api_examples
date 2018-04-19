(function () {
    'use strict';

    angular.module('iguazio.app')
        .config(routes);

    function routes($stateProvider, $urlRouterProvider) {
        $stateProvider

            //
            // Base
            //

            .state('app', {
                abstract: true,
                url: '/',
                views: {
                    header: {
                        templateUrl: 'views/app/header.tpl.html'
                    },
                    main: {
                        templateUrl: 'views/app/main.tpl.html'
                    }
                }
            })

            //
            // Dashboard
            //

            .state('app.dashboard', {
                url: 'dashboard',
                views: {
                    main: {
                        templateUrl: 'dashboard/dashboard.tpl.html',
                        controller: 'DashboardController',
                        controllerAs: 'dashboard'
                    }
                },
                data: {
                    pageTitle: 'Dashboard'
                }
            })
            .state('app.dashboard.overview', {
                url: '/overview',
                views: {
                    dashboard: {
                        templateUrl: 'dashboard/dashboard-overview/dashboard-overview.tpl.html',
                        controller: 'DashboardOverviewController',
                        controllerAs: 'overview'
                    }
                },
                data: {
                    pageTitle: 'Overview'
                }
            });

        $urlRouterProvider
            .when('/dashboard', '/dashboard/overview')
            .otherwise('/dashboard/overview');
    }
}());
