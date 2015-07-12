/**
 * This directive will facilitate the lookups values for entities on the server.
 *
 * User: rowan.massey
 * Date: 07/04/2015
 */

(function () {
    "use strict";

    var customLookup = function () {

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

                //This method executes the passed in function. It should resolve an array of objects
                scope.search = function () {
                    var returnedRecords = scope.lookupDatasource()(input.val());
                    scope.foundRecords = returnedRecords;
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
    angular.module("ruaghain.lookup-directive", []).directive('customLookup', [customLookup]);
})();