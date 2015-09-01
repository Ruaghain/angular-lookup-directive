/**
 * This directive will facilitate the lookups values for entities on the server.
 *
 * User: rowan.massey
 * Date: 07/04/2015
 */

(function () {
    "use strict";

    var injectParams = ["$http", "$q"];

    var customLookup = function ($http, $q) {

        var template = '<div>' +
                '<input type="text" class="ruaghain-lookup" ng-keyup="search()">' +
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

                //This method is responsible for the actual search, and will call the relevant method.
                scope.search = function () {
                    if (scope.lookupDatasource().type.toLowerCase() == "rest") {
                        scope.findRestData().then(function (data) {
                            scope.foundRecords = data
                        })
                    }
                };

                //Finds the required record(s) by performing the request using the information given in the datasource.
                scope.findRestData = function () {
                    var deferred = $q.defer();
                    var datasource = scope.lookupDatasource();
                    var enteredValue = encodeURIComponent("%" + input.val() + "%");
                    $http.get(datasource.baseUrl + datasource.searchUrl + enteredValue).then(function (data) {
                        if (datasource.payload(data.data)) {
                            deferred.resolve(datasource.payload(data.data));
                        } else {
                            deferred.reject();
                        }
                    }, function (error) {
                        deferred.reject(error);
                        throw new Error("There was an error looking up information")
                    });
                    return deferred.promise;
                }
            };

        return {
            restrict: "E",
            scope: {
                lookupDatasource: "&",
                lookupTextField: "@",
                lookupValueField: "@",
                ngModel: "="
            },
            require: "ngModel",
            template: template,
            link: link
        };
    };
    customLookup.$inject = injectParams;
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", customLookup);
})();