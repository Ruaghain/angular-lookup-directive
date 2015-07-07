/**
 * This directive will facilitate the lookups values for entities on the server.
 *
 * User: rowan.massey
 * Date: 07/04/2015
 */

(function () {
    "use strict";

    var customLookup = function ($q) {
        return {
            restrict: "E",
            replace: true,
            scope: {
                lookupDatasource: "&",
                lookupTextField: "@",
                lookupValueField: "@"
            },
            templateUrl: "lookup.html",
            link: function ($scope, element) {
                $scope.onItemSelect = function (item) {
                    element.find("input").val(item[$scope.lookupTextField]);
                    $scope.foundRecords = [];
                };

                $scope.search = function () {
                    var defer = $q.defer();
                    defer.resolve($scope.lookupDatasource({searchValue: $scope.searchTerm}));
                    defer.promise.then(function (searchResults) {
                        $scope.foundRecords = searchResults;
                    });
                };
            },
            controller: function ($scope, $q) {
            }
        };
    };
    angular.module("ruaghain.lookup-directive", []).directive('', customLookup);
})();