/**
 * This directive will facilitate the lookups values for entities on the server.
 *
 * User: rowan.massey
 * Date: 07/04/2015
 */

(function () {
    "use strict";

    var customLookup = function ($q) {

        var template = '<div>' +
                '<input type="text" ng-keyup="search()">' +
                '<ul>' +
                '<li ng-repeat="record in foundRecords">' +
                '<a href="#" data-id="{{record[lookupValueField]}}" ng-click="onItemSelect(record)">{{record[lookupTextField]}}</a>' +
                '</li>' +
                '</ul>' +
                '</div>',

            link = function (scope, element, attributes, ngModelController) {
                var input = element.find("input");

                scope.onItemSelect = function (item) {
                    input.val(item[scope.lookupTextField]);
                    ngModelController.$setViewValue(item[scope.lookupValueField]);
                    scope.foundRecords = [];
                };

                scope.search = function () {
                    var defer = $q.defer();
                    defer.resolve(scope.lookupDatasource()(input.val()));
                    defer.promise.then(function (searchResults) {
                        scope.foundRecords = searchResults;
                    });
                };
            };

        return {
            restrict: "E",
            scope: {
                lookupDatasource: "&",
                lookupTextField: "@",
                lookupValueField: "@"
            },
            replace: true,
            require: "ngModel",
            template: template,
            link: link
        };
    };
    angular.module("ruaghain.lookup-directive", []).directive('customLookup', ["$q", customLookup]);
})();