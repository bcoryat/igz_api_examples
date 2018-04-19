(function () {
    'use strict';

    var injectedConfig = angular.fromJson('/* @echo IGZ_CUSTOM_CONFIG */' || '{}');

    var defaultConfig = {
        baseUrl: 'http://127.0.0.1:8081/1/vin',
        trucksTable: 'data',
        histogramTable: 'meta',
        heatmap: {
            radius: 30,
            blur: 20
        },
        refreshDelay: 5000,
        weather: {
            sunny: 'sunny',
            rainy: 'rainy',
            cloudy: 'cloudy',
            snowy: 'snowy',
            stormy: 'stormy'
        }
    };

    angular.module('iguazio.app')
        .config(configToastr)
        .config(config)
        .config(scrollBarsConfig);

    angular.module('iguazio.app')
        .constant('ConfigService', angular.extend(defaultConfig, injectedConfig));

    function config($locationProvider) {
        $locationProvider.html5Mode(true);
    }

    function configToastr(toastrConfig) {
        angular.extend(toastrConfig, {
            autoDismiss: true,
            newestOnTop: true,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            preventOpenDuplicates: true,
            target: 'body'
        });
    }

    function scrollBarsConfig(ScrollBarsProvider) {
        ScrollBarsProvider.defaults = {
            scrollButtons: {
                enable: false // disable scrolling buttons by default
            },
            axis: 'y', // enable 1 axis scrollbar by default
            autoHideScrollbar: false,
            alwaysShowScrollbar: 0,
            theme: 'dark'
        };
    }
}());
