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
                '<a href="#" ng-click="onItemSelect(record)">{{record[lookupTextField]}}</a>' +
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

                //Ensure that a promise is returned from the controller, that will get resolved here, which is perfectly acceptable for the minute.
                scope.search = function () {
                    scope.lookupDatasource()(input.val()).then(function (data) {
                        scope.foundRecords = data;
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
            require: "ngModel",
            template: template,
            link: link
        };
    };
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", [customLookup]);
})();