(function () {
    "use strict";

    angular.module("kids")
        .component("rewardDeliveries", {
            templateUrl: "/js/angular/activity-reward/reward-deliveries.template.html",
            controller: "rewardDeliveriesController",
            bindings: {
                deliveryInfo: '<'
            }
        })

        .controller("rewardDeliveriesController",
            [function () {
                var ctrl = this;

                ctrl.getIcon = function(activityName) {
                    if(activityName === 'read'){
                        return 'icon icon-readC';
                    }
                    else if(activityName === 'listen'){
                        return 'icon icon-listenC';
                    }
                    else if(activityName === 'quiz'){
                        return 'icon icon-quizC';
                    }
                    else if(activityName === 'watch'){
                        return 'icon icon-watchC';
                    }
                    else if(activityName === 'interactive_lesson'){
                        return 'icon icon-interactivityC';
                    }
                    else{
                        return 'error';
                    }
                };

            }]);
}());