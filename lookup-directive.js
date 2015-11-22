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

        var template =
                '<div ng-cloak>' +
                '<input type="text" ng-model="value" class="ruaghain-lookup" ng-keyup="onInputKeyUp($event)">' +
                '<ul ng-keydown="onListKeyDown($event)">' +
                        '<li ng-repeat="record in foundRecords">' +
                '<a href="" ng-click="onItemSelect(record)" ng-keyup="onItemKeyUp($event, record)">{{record[lookupTextField]}}</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
                '<div ng-show="addRecord">' +
                    '<button id="btnSave" ng-click="saveLookup()">Save</button>' +
                    '<button id="btnCancel" ng-click="cancel()">Cancel</button>' +
                '</div>',

            link = function (scope, element, attributes, ngModelController) {
                if (!ngModelController) return;

                var input = element.find("input");

                /**
                 * Formats the data coming up from the model, into the view
                 */
                ngModelController.$formatters.push(function (modelValue) {
                    if (modelValue) {
                        return {
                            id: modelValue[scope.lookupValueField],
                            value: modelValue[scope.lookupTextField]
                        };
                    }
                });

                /**
                 * This returns the defined value back to the model.
                 */
                ngModelController.$parsers.push(function (viewValue) {
                    var id = viewValue[scope.lookupValueField];
                    var value = viewValue[scope.lookupTextField];
                    return {
                        id: id,
                        value: value
                    };
                });

                //ngModelController.$validators.idExists = function(modelValue, viewValue) {
                //    var value = modelValue || viewValue;
                //    return !ngModelController.$isEmpty(value[scope.lookupValueField])
                //};

                //scope.$watch("value", function(newValue, oldValue) {
                //    var newval = newValue;
                //    var oldval = oldValue;
                //});

                /**
                 *
                 */
                ngModelController.$render = function () {
                    scope.id = ngModelController.$viewValue.id;
                    scope.value = ngModelController.$viewValue.value;
                };

                /**
                 * This code gets executed as soon as an item on the dropdown gets clicked.
                 *
                 * @param item The li item that was selected.
                 */
                scope.onItemSelect = function (item) {
                    input.val(item[scope.lookupTextField]);
                    ngModelController.$setViewValue(item);
                    scope.searching = false;
                    scope.clearResults();
                };

                /**
                 * This method will only search when alphanumeric characters (and the down arrow key) are pressed.
                 * If the ESC key is pressed then the results are cleared.
                 *
                 * @param $event The key press event.
                 */
                scope.onInputKeyUp = function ($event) {
                    var charCode = $event.which;
                    if (charCode === 27 || (charCode != 40 && ngModelController.$isEmpty(input.val()))) {
                        scope.clearResults();
                    } else if (((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || (charCode === 40))) {
                        if (scope.searching && charCode === 40) {
                            //Don't reissue the search request if the down arrow is pressed multiple times.
                            return;
                        }
                        //Only search when alphanumeric characters have been pressed.
                        scope.search();
                    }
                };

                /**
                 * This method deals with selecting the relevant item that is active in the list
                 *
                 * @param $event The event to be checked for.
                 * @param item The item that was selected.
                 */
                scope.onItemKeyUp = function ($event, item) {
                    var charCode = $event.which;
                    if (charCode === 13) {
                        scope.onItemSelect(item);
                    }
                };

                /**
                 * This method will clear the results of the search if focus has been lost.
                 */
                scope.onBlur = function () {
                    //if (scope.searching) {
                    //    scope.clearResults();
                    //    scope.value = '';
                    //}
                };

                scope.onListKeyDown = function (e) {
                    e.preventDefault();

                    if (e.which === 27) {
                        scope.clearResults();
                    }

                    if (e.which == 40) {
                        var next = e.target.parentElement.nextElementSibling;
                        if (next) {
                            next.firstChild.focus();
                        } else {
                            e.target.parentElement.parentElement.firstElementChild.focus();
                        }
                    } else if (e.which == 38) {
                        var previous = e.target.parentElement.previousElementSibling;
                        if (previous) {
                            previous.firstChild.focus();
                        } else {
                            e.target.parentElement.parentElement.lastElementChild.focus();
                        }
                    }
                };

                /**
                 * This method clears the results of any searches, along with the displaying of the save and cancel buttons
                 */
                scope.clearResults = function () {
                    scope.foundRecords = [];
                    scope.addRecord = false;
                    scope.searching = false;
                };

                /**
                 * Ensure that a promise is returned from the controller, that will get resolved here, which is perfectly acceptable for the minute.
                 */
                scope.search = function () {
                    scope.searching = true;
                    scope.findRestData(input).then(function (data) {
                        scope.addRecord = scope.lookupAllowInsert && (typeof data == 'undefined' || data.length === 0);
                        scope.foundRecords = data;
                    });
                };

                /**
                 * This method will save a resource if one doesn't exist for the typed in value.
                 */
                scope.saveLookup = function () {
                    var newValue = input.val();
                    var SaveUrl = scope.lookupDatasource().baseUrl;
                    var payload = '{"' + scope.lookupTextField + '":"' + newValue + '"}';

                    var deferred = $q.defer();
                    $http.post(SaveUrl, payload).then(function (result) {
                        scope.getResource(result.headers('location')).then(function (data) {
                            ngModelController.$setViewValue(data);
                            scope.clearResults();
                        });
                    }, function (error) {
                        deferred.reject(error);
                        throw new Error("There was an error saving the record: " + error.data.message);
                    });
                };

                /**
                 * This method executes when the cancel button is pressed.
                 */
                scope.cancel = function () {
                    scope.clearResults();
                    ngModelController.$rollbackViewValue()
                };

                /**
                 * This method will retrieve a given resource for the provided Url
                 *
                 * @param url The url for the required resource.
                 * @returns {*} A promise for the required information.
                 */
                scope.getResource = function (url) {
                    var deferred = $q.defer();
                    $http.get(url).then(function (data) {
                        deferred.resolve(data.data);
                    }, function (error) {
                        deferred.reject(error);
                        throw new Error("There was an error looking up information");
                    });
                    return deferred.promise;
                };
            };

        var controller = ["$scope", function (scope) {
            scope.searching = false;
            scope.lookupAllowInsert = angular.isDefined(scope.lookupAllowInsert) ? scope.lookupAllowInsert : false;

            /**
             * This method finds the entered in information for the rest datasource.
             *
             * @param input The actual input component.
             * @returns {*}
             */
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
                lookupValueField: "@",
                lookupAllowInsert: "=?"
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