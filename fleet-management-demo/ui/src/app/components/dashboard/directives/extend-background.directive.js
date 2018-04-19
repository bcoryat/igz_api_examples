(function () {
    'use strict';

    /**
     * Extend white background to the bottom of the view port
     */
    angular.module('iguazio.app')
        .directive('igzExtendBackground', igzExtendBackground);

    function igzExtendBackground($timeout, WindowDimensionsService) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
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
                $timeout(elementMinHeight, 0);
                scope.$on('igzWatchWindowResize::resize', elementMinHeight);
            }

            /**
             * Calculate and change element height
             *
             * @private
             */
            function elementMinHeight() {
                var box = element[0].getBoundingClientRect();
                var container = angular.element('body > div.container-fluid');
                var paddingBottom = parseInt(container.css('padding-bottom'), 10);

                element.css('height', (WindowDimensionsService.height() - box.top - paddingBottom) + 'px');
            }
        }
    }
}());
