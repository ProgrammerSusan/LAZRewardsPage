(function () {
    "use strict";

    angular.module("kids")
        .component("activityReward", {
            templateUrl: "/js/angular/activity-reward/activity-reward.template.html",
            controller: "activityRewardController",
            bindings: {
                rewardPageContent: '<'
            }
        })

        .controller("activityRewardController",
            [
                function activityRewardController() {
                    var ctrl = this;

                    ctrl.$postLink = function() {
                        ctrl.rewardHeader = ctrl.rewardPageContent.rewardHeader;
                        ctrl.reward = ctrl.rewardPageContent.reward;
                        ctrl.activityTotal = ctrl.rewardPageContent.activityTotal;
                        ctrl.levelUpInfo = ctrl.rewardPageContent.levelUpInfo;
                        ctrl.deliveryInfo = ctrl.rewardPageContent.deliveryInfo;
                    };
                }]);
}());