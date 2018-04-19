(function () {
    'use strict';

    /*
     * Get window height and width
     *
     * Usage:
     * WindowDimensionsService.height();
     * WindowDimensionsService.width();
     *
     */
    angular.module('iguazio.app')
        .factory('WindowDimensionsService', WindowDimensionsService);

    function WindowDimensionsService($window, $document) {
        return {
            height: height,
            width: width,
            addOverflow: addOverflow,
            removeOverflow: removeOverflow
        };

        //////////

        //
        // Public methods
        //

        /**
         * Returns the viewport's height
         *
         * @returns {number}
         */
        function height() {
            var doc = $document[0];
            return $window.innerHeight || doc.documentElement.clientHeight || doc.body.clientHeight;
        }

        /**
         * Returns the viewport's width
         *
         * @returns {number}
         */
        function width() {
            var doc = $document[0];
            return $window.innerWidth || doc.documentElement.clientWidth || doc.body.clientWidth;
        }

        /**
         * Removes class which sets overflow to hidden
         */
        function addOverflow() {
            var elem = angular.element(document).find('body>.container-fluid');
            elem.removeClass('no-overflow');
        }

        /**
         * Adds class which sets overflow to hidden
         */
        function removeOverflow() {
            var elem = angular.element(document).find('body>.container-fluid');
            elem.addClass('no-overflow');
        }
    }
}());
