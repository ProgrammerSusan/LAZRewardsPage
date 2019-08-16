(function () {
    "use strict";

    angular.module("kids")
        .component("favorite", {
            templateUrl: "/js/angular/activity-reward/favorite.template.html",
            controller: "favoriteController",
            bindings: {
                favoriteData: '<'
            }
        })

        .controller("favoriteController",
            ["rewardContentsFactory", function (rewardContentsFactory) {
                var ctrl = this;
                var disableClick = false;

                ctrl.$onInit = function () {
                        ctrl.canFavoriteResource = ctrl.favoriteData.canFavoriteResource;
                        ctrl.bookId = ctrl.favoriteData.bookId;
                        ctrl.isFavorite = ctrl.favoriteData.isFavorite;
                        ctrl.isDisbaled = false;
                };

                ctrl.saveFavoriteState = function(bookId){
                    if(!disableClick){
                        disableClick = true;
                        rewardContentsFactory.saveFavoriteState(ctrl.isFavorite, bookId).then(function success() {
                            if(!ctrl.isFavorite) {
                                disableClick = false;
                                ctrl.isFavorite = true;
                            }
                            else if(ctrl.isFavorite) {
                                disableClick = false;
                                ctrl.isFavorite = false;
                            }
                            else {
                                disableClick = true;
                                ctrl.isDisabled = true;
                            }
                        }, function error() {
                            disableClick = true;
                            ctrl.isDisabled = true;
                        });
                    }
                };

            }]);
}());