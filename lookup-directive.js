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
                '<ul ng-show="!foundRecords.length" >' +
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
                        };
                    }
                });

                //This returns the defined value back to the model.
                ngModelController.$parsers.push(function (viewValue) {
                    var id = viewValue[scope.lookupValueField];
                    var value = viewValue[scope.lookupTextField];
                    return {
                        id: id,
                        value: value
                    };
                });

                ngModelController.$render = function () {
                    scope.id = ngModelController.$viewValue.id;
                    scope.value = ngModelController.$viewValue.value;
                };

                //This code gets executed as soon as an item on the dropdown gets clicked.
                scope.onItemSelect = function (item) {
                    input.val(item[scope.lookupTextField]);
                    ngModelController.$setViewValue(item);
                    scope.foundRecords = [];
                };

                //Ensure that a promise is returned from the controller, that will get resolved here, which is perfectly acceptable for the minute.
                scope.search = function () {
                    scope.findRestData(input).then(function (data) {
                        scope.foundRecords = data;
                    });
                };
            };

        var controller = ["$scope", function(scope) {
            //This method finds the entered in information for the rest datasource.
            scope.findRestData = function (input) {
                var deferred = $q.defer();
                var datasource = this.lookupDatasource();
                var actualEnteredValue = input.val();
                var encodedValue = encodeURIComponent("%" + actualEnteredValue + "%");
                $http.get(datasource.baseUrl + datasource.searchUrl + encodedValue).then(function (data) {
                    if (datasource.payload(data.data)) {
                        deferred.resolve(datasource.payload(data.data));
                    } else {
                        //Need to resolve to a blank object, so it returns nothing.
                        deferred.resolve();
                    }
                }, function (error) {
                    deferred.reject(error);
                    throw new Error("There was an error looking up information");
                });
                return deferred.promise;
            };
        }];

        return {
            restrict: "E",
            scope: {
                lookupDatasource: "&",
                lookupTextField: "@",
                lookupValueField: "@"
            },
            require: "ngModel",
            template: template,
            link: link,
            controller: controller
        };
    };
    customLookup.$inject = injectParams;
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", customLookup);
})();