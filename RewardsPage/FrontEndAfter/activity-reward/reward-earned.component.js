(function () {
    "use strict";

    angular.module("kids")
        .component("rewardEarned", {
            templateUrl: "/js/angular/activity-reward/reward-earned.template.html",
            controller: "rewardEarnedController",
            bindings: {
                reward: '<'
            }
        })

        .controller("rewardEarnedController",
            [function () {
                var ctrl = this;

                ctrl.$onInit = function() {
                    ctrl.starsEarned = ctrl.reward.stars;
                    ctrl.message = ctrl.reward.message;
                };

            }]);
}());