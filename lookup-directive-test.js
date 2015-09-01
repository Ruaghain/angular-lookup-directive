describe("Directive: customLookup", function () {
    var $compile,
        $scope,
        $timeout,
        $httpBackend,
        $q,
        element;

    beforeEach(module("ruaghain.lookup-directive"));

    beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_, _$httpBackend_, _$q_) {
        $compile = _$compile_;
        $scope = _$rootScope_.$new();
        $timeout = _$timeout_;
        $httpBackend = _$httpBackend_;
        $q = _$q_;

        $scope.dataSource = {
            type: "REST",
            baseUrl : "http://localhost/api/users",
            searchUrl : "/search/findByName?name=",
            payload: "_embedded[currencies]"
        };

        $scope.findUsers = function () {
            currencies = {
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
        };

        $scope.user = {userId: null};

        element = angular.element('<custom-lookup ng-model="user.userId" lookup-datasource="dataSource" lookup-text-field="name" lookup-value-field="id"></custom-lookup>');
        $compile(element)($scope);
        $scope.$digest();
    }));

    it("Contains the relevant isolated scope variables, which have been correctly set", function () {

        expect(element.isolateScope().lookupDatasource).toBeDefined();
        expect(element.isolateScope().lookupTextField).toBe("fullName");
        expect(element.isolateScope().lookupValueField).toBe("id");
    });

    it("Replaces the element with the appropriate text for lookups", function () {
        expect(element.find("input").attr("type")).toEqual('text');
    });

    it("Contains the relevant keyup attribute", function () {
        expect(element.find("input").attr("ng-keyup")).toEqual('search()');
    });

    it("Performs search on key up", function () {
        element.find("input").triggerHandler("keyup");
        expect(element.find("li").length).toEqual(2);
    });

    it("Text value and associated model of selected item are populated accordingly.", function () {
        element.find("input").triggerHandler("keyup");
        element.find("a").triggerHandler("click");
        expect(element.find("input").val()).toBe("First User");
        expect($scope.user.userId).toBe(1);
    });

});