(function () {
    "use strict";

    angular.module("kids")
        .factory("rewardContentsFactory", ["$http", function ($http) { function saveFavoriteState(isActive, bookId){
                if(!isActive) {
                    return $http.put("/api/favorite/resource/" + bookId);
                }
                else {
                    return $http.delete("/api/favorite/resource/" + bookId);
                }
            }

            return {
                saveFavoriteState: saveFavoriteState
            };
        }]);
})();

