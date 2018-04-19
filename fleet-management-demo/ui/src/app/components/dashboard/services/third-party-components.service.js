(function () {
    'use strict';

    /* global moment:false */
    /* global Highcharts:false */

    /**
     * All third-party components' global variables placed here as constants
     * in order to inject them in other angular app components
     */
    angular.module('iguazio.app')
        .constant('moment', moment)
        .constant('Highcharts', Highcharts);
}());
