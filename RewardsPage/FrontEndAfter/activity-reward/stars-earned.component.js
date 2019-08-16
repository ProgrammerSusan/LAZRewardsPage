(function () {
    "use strict";

    angular.module("kids")
        .component("starsEarned", {
            templateUrl: "/js/angular/activity-reward/stars-earned.template.html",
            controller: "starsEarnedController",
            bindings: {
                stars: '<'
            }
        })

        .controller("starsEarnedController",
            [function () {
                var ctrl = this;

                ctrl.$onInit = function() {
                    ctrl.starsEarned = ctrl.stars;
                };

            }]);
}());