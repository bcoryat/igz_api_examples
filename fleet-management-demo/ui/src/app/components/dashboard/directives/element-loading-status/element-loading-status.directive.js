(function () {
    'use strict';

    angular.module('iguazio.app')
        .directive('igzElementLoadingStatus', igzElementLoadingStatus);

    function igzElementLoadingStatus($timeout) {
        return {
            restrict: 'A',
            scope: {
                name: '@igzElementLoadingStatus',
                loadingStatusSize: '@?'
            },
            templateUrl: 'dashboard/directives/element-loading-status/element-loading-status.tpl.html',
            controller: IgzElementLoadingStatusController,
            controllerAs: 'elementLoadingStatus',
            link: link,
            transclude: true,
            bindToController: true
        };

        function link(scope, element) {
            var vm = scope.elementLoadingStatus;

            activate();

            //////////

            //
            // Private methods
            //

            /**
             * Set height of spinner wrapper
             *
             * @private
             */
            function activate() {
                setWrapperHeight();

                // Bind "setWrapperHeight" method to controller
                vm.setWrapperHeight = setWrapperHeight;
            }

            /**
             * Set height of spinner wrapper
             *
             * @private
             */
            function setWrapperHeight() {
                $timeout(function () {
                    var elementHeight = element.outerHeight();
                    var elementParentHeight = element.parent().outerHeight();

                    if (vm.isShowSpinner) {
                        element.find('.loader-wrapper').height(elementHeight || elementParentHeight);
                    }

                    if (vm.isShowError) {
                        element.find('.loading-error').height(elementHeight || elementParentHeight);
                    }
                }, 0);
            }
        }
    }

    function IgzElementLoadingStatusController($scope, $state) {
        var vm = this;

        vm.isShowSpinner = true;
        vm.isShowError = false;

        vm.refreshPage = refreshPage;
        vm.checkSize = checkSize;

        activate();

        //////////

        //
        // Public methods
        //

        /**
         * Refresh current page (ui-router state)
         *
         * @param {Object} $event - angular event object
         */
        function refreshPage($event) {

            // Prevent 'upper' events to be triggered
            $event.stopPropagation();

            $state.go($state.current, {}, {reload: true});
        }

        /**
         * Check if given size is actual
         *
         * @param {string} size - size name ('small, 'default')
         */
        function checkSize(size) {
            return vm.loadingStatusSize === size;
        }

        //
        // Private methods
        //

        /**
         * Show given loading spinner
         *
         * @private
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function showSpinner(ev, args) {
            if (args.name === vm.name) {
                vm.isShowError = false;
                vm.isShowSpinner = true;
                vm.setWrapperHeight();
            }
        }

        /**
         * Hide given loading spinner
         *
         * @private
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function hideSpinner(ev, args) {
            if (args.name === vm.name) {
                vm.isShowSpinner = false;
            }
        }

        /**
         * Show given loading error
         *
         * @private
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function showError(ev, args) {
            if (args.name === vm.name) {
                vm.isShowError = true;
                vm.isShowSpinner = false;
                vm.setWrapperHeight();
            }
        }

        /**
         * Hide given loading error
         *
         * @private
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function hideError(ev, args) {
            if (args.name === vm.name) {
                vm.isShowError = false;
            }
        }

        /**
         * Constructor method
         *
         * @private
         */
        function activate() {
            if (!vm.loadingStatusSize) {
                vm.loadingStatusSize = 'default';
            }

            $scope.$on('element-loading-status_show-spinner', showSpinner);
            $scope.$on('element-loading-status_hide-spinner', hideSpinner);

            $scope.$on('element-loading-status_show-error', showError);
            $scope.$on('element-loading-status_hide-error', hideError);
        }
    }
}());
