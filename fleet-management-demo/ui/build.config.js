/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
    /**
     * Source folders
     */
    source_dir: 'src',

    /**
     * Destination folders
     */
    build_dir: 'dist',
    assets_dir: 'dist/assets',

    /**
     * App files and configs
     */
    app_files: {
        js: [
            'src/app/app.module.js',
            'src/app/app.config.js',
            'src/app/app.route.js',
            'src/app/app.run.js',
            'src/app/app.controller.js',
            'src/app/components/**/*.js',
            '!src/app/components/**/*.spec.js',
            'src/app/shared/**/*.js',
            '!src/app/shared/**/*.spec.js'
        ],
        html: 'src/index.html',
        less_files: [
            'src/less/**/*.less',
            'src/app/components/**/*.less'
        ],
        templates: 'src/app/components/**/*.tpl.html', // html files should be only in components folder
        templates_module_name: 'iguazio.app.templates'
    },

    /**
     * Third-party libs (files order is important)
     */
    vendor_files: {
        js: [
            'vendor/jquery/dist/jquery.js',
            'vendor/angular/angular.js',
            'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
            'vendor/angular-ui-router/release/angular-ui-router.js',
            'vendor/angular-ui-layout/src/ui-layout.js',
            'vendor/jquery-ui/ui/core.js',
            'vendor/jquery-ui/ui/widget.js',
            'vendor/jquery-ui/ui/mouse.js',
            'vendor/jquery-ui/ui/sortable.js',
            'vendor/angular-ui-sortable/sortable.js',
            'vendor/moment/moment.js',
            'vendor/angular-animate/angular-animate.js',
            'vendor/angular-cookies/angular-cookies.js',
            'vendor/highcharts/highcharts.src.js',
            'vendor/highcharts/highcharts-more.src.js',
            'vendor/highcharts/modules/map.src.js',
            'vendor/highcharts/modules/treemap.js',
            'vendor/highcharts-ng/dist/highcharts-ng.js',
            'vendor/bootstrap/js/dropdown.js',
            'vendor/ng-dialog/js/ngDialog.js',
            'vendor/ng-lodash/build/ng-lodash.js',
            'vendor/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js',
            'vendor/ng-scrollbars/dist/scrollbars.min.js',
            'vendor/angular-toastr/dist/angular-toastr.js',
            'vendor/angular-toastr/dist/angular-toastr.tpls.js',
            'vendor/ngmap/build/scripts/ng-map.min.js',
            'node_modules/ui-leaflet/node_modules/leaflet/dist/leaflet.js',
            'node_modules/ui-leaflet/dist/ui-leaflet.min.js',
            'node_modules/ui-leaflet/node_modules/angular-simple-logger/dist/angular-simple-logger.min.js',
            'node_modules/angular-simple-logger/dist/angular-simple-logger.min.js',
            'node_modules/ui-leaflet-layers/dist/ui-leaflet-layers.min.js',
            'node_modules/leaflet.heat/dist/leaflet-heat.js',
            'vendor/angular-geohash/dist/angular-geohash.min.js'
        ],
        less: [
            'vendor/bootstrap/less/bootstrap.less',
            'src/less/variables.less'
        ],
        css: [
            'vendor/jquery-ui/themes/redmond/jquery-ui.css',
            'vendor/jquery-ui/themes/redmond/theme.css',
            'vendor/angular-ui-layout/src/ui-layout.css',
            'vendor/ng-dialog/css/ngDialog.css',
            'vendor/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css',
            'vendor/angular-toastr/dist/angular-toastr.css',
            'node_modules/ui-leaflet/node_modules/leaflet/dist/leaflet.css'
        ]
    },

    /**
     * Config for output files
     */
    output_files: {
        app: {
            js: 'app.js',
            css: 'app.css',
            js_manifest: 'app.manifest.json',
            css_manifest: 'app.manifest.json'
        },
        vendor: {
            js: 'vendor.js',
            css: 'vendor.css',
            js_manifest: 'vendor.manifest.json',
            css_manifest: 'vendor.manifest.json'
        }
    },

    /**
     * Config for resources
     */
    resources: {
        previewServer: './resources/previewServer',
        mockBackendServer: './resources/mockBackendServer',
        errHandler: './resources/gulpErrorHandler'
    }
};
