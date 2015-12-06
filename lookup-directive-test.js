describe("Directive: customLookup", function () {
    var $compile,
        $scope,
        $timeout,
        $httpBackend,
        $q,
        element,
        parent;

    beforeEach(module("ruaghain.lookup-directive"));

    beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_, _$httpBackend_, _$q_) {
        $compile = _$compile_;
        $scope = _$rootScope_.$new();
        $timeout = _$timeout_;
        $httpBackend = _$httpBackend_;
        $q = _$q_;

        $scope.dataSource = {
            type: "REST",
            baseUrl: "http://localhost/api/users",
            searchUrl: "/search/findByName?name=",
            payload: function (data) {
                if (data) {
                    return data._embedded.currencies;
                }
            }
        };

        $scope.currencies = {
            "_links": {
                "self": {
                    "href": "http://localhost:8080/api/currencies{?page,size,sort}",
                    "templated": true
                },
                "search": {
                    "href": "http://localhost:8080/api/currencies/search"
                }
            },
            "_embedded": {
                "currencies": [{
                    "id": 1,
                    "name": "Euro",
                    "iso": "EUR",
                    "_links": {
                        "self": {
                            "href": "http://localhost:8080/api/currencies/1"
                        }
                    }
                }, {
                    "id": 2,
                    "name": "British Pound",
                    "iso": "GBP",
                    "_links": {
                        "self": {
                            "href": "http://localhost:8080/api/currencies/2"
                        }
                    }
                }]
            },
            "page": {
                "size": 20,
                "totalElements": 2,
                "totalPages": 1,
                "number": 0
            }
        };
        $scope.currency = {id: null};

    }));

    function compileDirective(template) {
        //Need to wrap the template in a div to get access to the UL, and LI items.
        template = "<div>" + template + "</div>";
        parent = angular.element(template);

        element = parent.find("input");

        $compile(element)($scope);
        $scope.$digest();
    }

    it("Contains the relevant isolated scope variables, which have been correctly set", function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');

        expect(element.isolateScope().lookupDatasource).toBeDefined();
        expect(element.isolateScope().lookupTextField).toBe("name");
        expect(element.isolateScope().lookupValueField).toBe("id");
        expect(element.isolateScope().lookupAllowInsert).toBe(true);
    });

    it("Performs search on key press", function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');
        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);

        $httpBackend.flush();

        expect(parent.find("li").length).toEqual(2);
        expect(element.isolateScope().itemSelected).toBe(false);
        expect(element.isolateScope().searching).toBe(true);
    });

    it("Performs search only once, when the down arrow is pressed", function () {
        var deferred = $q.defer();
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');
        spyOn(element.isolateScope(), "findRestData").and.returnValue(deferred.promise);
        deferred.resolve($scope.currencies._embedded.currencies);

        element.val("Eu");

        executeKeyEvent(element, 65);
        $scope.$digest();

        expect(parent.find("li").length).toEqual(2);
        expect(element.isolateScope().itemSelected).toBe(false);
        expect(element.isolateScope().searching).toBe(true);

        executeKeyEvent(element, 40);

        expect(parent.find("li").length).toEqual(2);
        expect(element.isolateScope().itemSelected).toBe(false);
        expect(element.isolateScope().searching).toBe(true);
        expect(element.isolateScope().findRestData.calls.count()).toEqual(1);
    });

    it("Clears results on ESC key press", function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');
        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);

        $httpBackend.flush();
        expect(parent.find("li").length).toEqual(2);

        executeKeyEvent(element, 27);
        expect(parent.find("li").length).toEqual(0);
    });

    it("Text value and associated model of selected item are populated accordingly.", function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');

        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);
        $httpBackend.flush();

        parent.find("a").triggerHandler("click");
        expect(element.val()).toBe("Euro");
        expect($scope.currency.id).toBe(1);
    });

    it("Text value and associated model of selected item are populated accordingly when enter is pressed on selected item.", function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');

        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);
        $httpBackend.flush();

        executeKeyEvent(parent.find("a")[0], 13);

        expect(element.val()).toBe("Euro");
        expect($scope.currency.id).toBe(1);
        expect(element.isolateScope().itemSelected).toBe(true);
        expect(parent.find("li").length).toEqual(0);
    });

    it('Should respond with an error when performing the lookup.', function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');

        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond(500, '');
        expect(function () {
            element.val("Eu");

            executeKeyEvent(element, 65);

            $httpBackend.flush();
        }).toThrow();
    });

    it('Should reject request, and have nothing populated in found records.', function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');

        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond(200, '');
        element.val("Eu");

        executeKeyEvent(element, 65);

        $httpBackend.flush();
        expect(element.find("li").length).toEqual(0);
    });

    it('Should move to the next item in the list when the down arrow is pressed.', function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');
        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);

        $httpBackend.flush();
        expect(parent.find("li").length).toEqual(2);

        //TODO: How to determine the focus of the next element?
        executeKeyDownEvent(parent.find("ul"), 40);
    });

    it('Should move to the previous item in the list when the down arrow is pressed.', function () {
        compileDirective('<input custom-lookup ng-model="currency" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id" lookup-allow-insert="true">');
        $httpBackend.whenGET("http://localhost/api/users/search/findByName?name=%25Eu%25").respond($scope.currencies);
        element.val("Eu");

        executeKeyEvent(element, 65);

        $httpBackend.flush();
        expect(parent.find("li").length).toEqual(2);
        //parent.find("li")[1].focus();

        //TODO: How to determine the focus of the previous element?
        //executeKeyDownEvent(parent.find("ul"), 38);
    });

    function executeKeyEvent(input, key) {
        var aKeyPress = jQuery.Event("keypress");
        aKeyPress.which = key;
        angular.element(input).triggerHandler(aKeyPress);

        var aKeyUp = jQuery.Event("keyup");
        aKeyUp.which = key;
        angular.element(input).triggerHandler(aKeyUp);
    }

    function executeKeyDownEvent(input, key) {
        var aKeyDown = jQuery.Event("keydown");
        aKeyDown.which = key;
        angular.element(input).triggerHandler(aKeyDown);
    }

});