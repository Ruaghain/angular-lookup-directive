/**
 * This directive will facilitate the lookups values for entities on the server.
 *
 * User: rowan.massey
 * Date: 07/04/2015
 */

(function () {
    //TODO: Could the list item functionality be moved to another directive?

    "use strict";

    var injectParams = ["$http", "$q", "$compile"];

    var customLookup = function ($http, $q, $compile) {

        var template =
            '<div class="lookup-results">' +
                '<ul ng-keydown="onListKeyDown($event)">' +
                    '<li ng-repeat="record in foundRecords">' +
                        '<a href="" ng-click="onItemSelect(record)" ng-keyup="onItemKeyUp($event, record)">{{record[lookupTextField]}}</a>' +
                    '</li>' +
                '</ul>' +
                '<div ng-show="addRecord">' +
                    '<button id="btnSave" ng-click="saveLookup()">Save</button>' +
                    '<button id="btnCancel" ng-click="cancel()">Cancel</button>' +
                '</div>' +
            '</div>',

            link = function (scope, element, attributes, ngModelController) {
                if (!ngModelController) return;

                var lookups = $compile(template)(scope);
                element.after(lookups);

                /**
                 * This method will only search when alphanumeric characters (and the down arrow key) are pressed.
                 * If the ESC key is pressed then the results are cleared.
                 *
                 * @param $event The key press event.
                 */
                var onInputKeyUp = function ($event) {
                    var charCode = $event.which;
                    if (charCode === 27 || (charCode != 40 && ngModelController.$isEmpty(element.val()))) {
                        scope.clearResults();
                        scope.itemSelected = false;
                        //Need to clear the view value completely, otherwise the old value returns
                        ngModelController.$setViewValue(null);
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
                 * This method stops the kepress if an item has already been selected.
                 *
                 * @returns {boolean}
                 */
                var onInputKeyPress = function() {
                    if (scope.itemSelected) {
                        return false;
                    }
                };

                element.on("keyup", onInputKeyUp);
                element.on("keypress", onInputKeyPress);

                var required = attributes.$attr.required !== undefined;

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
                    if (viewValue) {
                        var id = viewValue[scope.lookupValueField];
                        var value = viewValue[scope.lookupTextField];
                        return {
                            id: id,
                            value: value
                        };
                    } else {
                        return {
                            id: '',
                            value: ''
                        };
                    }
                });

                /**
                 * This ensures that a value is selected if the required attribute is set.
                 *
                 * @param modelValue
                 * @param viewValue
                 * @returns {boolean}
                 */
                ngModelController.$validators.requiredItemSelected = function (modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    return required ? !ngModelController.$isEmpty(value[scope.lookupValueField]) : true;
                };

                /**
                 * This method gets invoked when the directive gets rendered, it sets the actual value of the directive.
                 */
                ngModelController.$render = function () {
                    scope.id = ngModelController.$modelValue[scope.lookupValueField];
                    scope.value = ngModelController.$modelValue[scope.lookupTextField];
                    element.val(scope.value);
                };

                /**
                 * This code gets executed as soon as an item on the dropdown gets clicked.
                 *
                 * @param item The li item that was selected.
                 */
                scope.onItemSelect = function (item) {
                    element.val(item[scope.lookupTextField]);
                    ngModelController.$setViewValue(item);
                    scope.itemSelected = true;
                    scope.clearResults();
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
                 * This method handles a key press on one of the selected list items.
                 *
                 * @param e
                 */
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
                    scope.findRestData(element).then(function (data) {
                        scope.addRecord = scope.lookupAllowInsert && (typeof data == 'undefined' || data.length === 0);
                        if (data && data.length == 1) {
                            scope.onItemSelect(data[0]);
                        } else {
                            scope.foundRecords = data;
                        }
                    });
                };

                /**
                 * This method will save a resource if one doesn't exist for the typed in value.
                 */
                scope.saveLookup = function () {
                    var newValue = element.val();
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
            scope.itemSelected = false;

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
            restrict: "A",
            scope: {
                lookupDatasource: "&",
                lookupTextField: "@",
                lookupValueField: "@",
                //This is an optional attribute
                lookupAllowInsert: "=?"
            },
            require: "ngModel",
            link: link,
            controller: controller
        };
    };
    customLookup.$inject = injectParams;
    angular.module("ruaghain.lookup-directive", []).directive("customLookup", customLookup);
})();