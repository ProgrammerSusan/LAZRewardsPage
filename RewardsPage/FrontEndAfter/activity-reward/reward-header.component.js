(function () {
    "use strict";

    angular.module("kids")
        .component("rewardHeader", {
            templateUrl: "/js/angular/activity-reward/reward-header.template.html",
            controller: "rewardHeaderController",
            bindings: {
                rewardHeader: '<'
            }
        })

        .controller("rewardHeaderController",
            [function () {
                var ctrl = this;

                ctrl.$onInit = function() {
                    ctrl.location = ctrl.rewardHeader.location;
                    ctrl.linkText = ctrl.rewardHeader.linkText;
                    ctrl.title = ctrl.rewardHeader.title;
                    ctrl.canFavoriteResource = ctrl.rewardHeader.favoriteData.canFavoriteResource;
                }

            }]);
}());