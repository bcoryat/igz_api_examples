(function () {
    'use strict';

    angular.module('iguazio.app')
        .filter('timeText', timeText);

    function timeText() {
        var factors = {
            minute: 60,
            hour: 3600,
            day: 86400,
            week: 604800,
            year: 31556926
        };

        return function (timeDifference) {
            var result;
            var x;
            var y;

            if (!angular.isNumber(timeDifference)) {
                return 'N/A';
            }

            switch (true) {
                case (timeDifference < factors.minute):
                    result = timeDifference + ' sec';
                    break;
                case (timeDifference < factors.hour):
                    x = Math.floor(timeDifference / factors.minute);
                    y = timeDifference - x * factors.minute;
                    result = x + ' min ' + y + ' sec';
                    break;
                case (timeDifference < factors.day):
                    x = Math.floor(timeDifference / factors.hour);
                    y = Math.floor((timeDifference - x * factors.hour) / factors.minute);
                    result = x + ' hr ' + y + ' min';
                    break;
                case (timeDifference < factors.week):
                    x = Math.floor(timeDifference / factors.day);
                    y = Math.floor((timeDifference - x * factors.day) / factors.hour);
                    result = x + ' d ' + y + ' hr';
                    break;
                case (timeDifference < factors.year):
                    x = Math.floor(timeDifference / factors.week);
                    y = Math.floor((timeDifference - x * factors.week) / factors.day);
                    result = x + ' w ' + y + ' d';
                    break;
                default:
                    x = Math.floor(timeDifference / factors.year);
                    y = Math.floor((timeDifference - x * factors.year) / factors.week);
                    result = x + ' yr ' + y + ' w';
                    break;
            }

            return result;
        };
    }
}());
