(function () {
    "use strict";

    angular.module("kids")
        .component("activityTotal", {
            templateUrl: "/js/angular/activity-reward/activity-total.template.html",
            controller: "activityTotalController",
            bindings: {
                activityTotal: '<'
            }
        })

        .controller("activityTotalController",
            [function () {
                var ctrl = this;
            }]);
}());