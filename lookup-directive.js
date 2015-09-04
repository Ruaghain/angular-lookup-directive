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
                '<input type="text" ng-model="value" class="ruaghain-lookup" ng-keyup="search()">' +
                '<ul>' +
                '<li ng-repeat="record in foundRecords">' +
                '<a href="#" ng-click="onItemSelect(record)">{{record[lookupTextField]}}</a>' +
                '</li>' +
                '</ul>' +
                '</div>',

            link = function (scope, element, attributes, ngModelController) {
                var input = element.find("input");

                //Formats the data coming up from the model, into the view
                ngModelController.$formatters.push(function (modelValue) {
                    if (modelValue) {
                        return {
                            id: modelValue[scope.lookupValueField],
                            value: modelValue[scope.lookupTextField]
                        }
                    } else {
                        return {};
                    }
                });

                //This returns the defined value back to the model.
                ngModelController.$parsers.push(function (viewValue) {
                    var id = viewValue[scope.lookupValueField];
                    var value = viewValue[scope.lookupTextField];
                    return {
                        id: id,
                        value: value
                    }
                });

                //Adds the values of the id and value to determine changes between the old and new value
                //scope.$watch("id + value", function (oldvalue, newvalue) {});
                //scope.$watch("id + value", function () {
                //    debugger;
                //    ngModelController.$setViewValue({id: scope.id, value: scope.value});
                //});

                ngModelController.$render = function () {
                    scope.id = ngModelController.$viewValue.id;
                    scope.value = ngModelController.$viewValue.value;
                };

                scope.onItemSelect = function (item) {
                    input.val(item[scope.lookupTextField]);
                    ngModelController.$setViewValue(item);
                    scope.foundRecords = [];
                };

                //Ensure that a promise is returned from the controller, that will get resolved here, which is perfectly acceptable for the minute.
                scope.search = function () {
                    scope.findRestData().then(function (data) {
                        scope.foundRecords = data
                    })
                };

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
                lookupValueField: "@"
            },
            require: "ngModel",
            template: template,
            link: link
        };
    };
    customLookup.$inject = injectParams;
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", customLookup);
})();