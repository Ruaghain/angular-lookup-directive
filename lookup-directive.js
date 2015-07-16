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

                //Would prefer to be able to get dynamic data from the datasource, may need to rethink that
                //as the directive processes the keyup before the request has full completed.
                scope.search = function () {
                    scope.foundRecords = scope.lookupDatasource({searchValue: input.val()});
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
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", [customLookup]);
})();