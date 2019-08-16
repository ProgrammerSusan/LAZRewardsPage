(function () {
    "use strict";

    angular.module("kids")
        .component("levelUpProgress", {
            templateUrl: "/js/angular/activity-reward/level-up-progress.template.html",
            controller: "levelUpProgressController",
            bindings: {
                levelUpInfo: '<'
            }
        })

        .controller("levelUpProgressController",
            [function () {
                var ctrl = this;

                ctrl.$onInit = function() {
                    ctrl.showLevelUpProgress = ctrl.levelUpInfo.showLevelUpProgress;
                    ctrl.tasksRemaining = ctrl.levelUpInfo.tasksRemaining;
                }
            }]);
}());