describe("Directive: customLookup", function () {
    var $compile,
        $rootScope,
        $timeout,
        $httpBackend,
        $q,
        element;

    beforeEach(module("ruaghain.lookup-directive"));

    beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_, _$httpBackend_, _$q_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        $httpBackend = _$httpBackend_;
        $q = _$q_;

        $rootScope.findUsers = function () {
            return [{
                "id": 1,
                "userName": "FirstUser",
                "firstName": "First",
                "lastName": "User",
                "_links": {
                    "self": {
                        "href": "http://localhost/api/users/1"
                    }
                }
            }, {
                "id": 2,
                "userName": "SecondUser",
                "firstName": "Second",
                "lastName": "User",
                "_links": {
                    "self": {
                        "href": "http://localhost/api/users/2"
                    }
                }
            }];
        };

        element = angular.element('<custom-lookup lookup-datasource="findUsers()" lookup-text-field="fullName" lookup-value-field="id"></custom-lookup>');
        $compile(element)($rootScope.$new());
    }));

    it("Contains the relevant isolated scope variables, which have been correctly set", function () {
        $rootScope.$digest();
        expect(element.isolateScope().lookupDatasource).toBeDefined();
        expect(element.isolateScope().lookupTextField).toBe("fullName");
        expect(element.isolateScope().lookupValueField).toBe("id");
    });

    it("Replaces the element with the appropriate text for lookups", function () {
        $rootScope.$digest();
        expect(element.find("input").attr("type")).toEqual('text');
    });

    it("Contains the relevant model attribute", function () {
        $rootScope.$digest();
        expect(element.find("input").attr("ng-model")).toEqual('searchTerm');
    });

    it("Contains the relevant keyup attribute", function () {
        $rootScope.$digest();
        expect(element.find("input").attr("ng-keyup")).toEqual('search()');
    });

    it("Contains the relevant angular class attribute values", function () {
        $rootScope.$digest();
        expect(element.find("input").attr("class")).toEqual('ng-pristine ng-untouched ng-valid');
    });

    it("Performs search on key up", function () {
        $rootScope.$digest();
        element.find("input").triggerHandler("keyup");
        expect(element.find("li").length).toEqual(2);
    });

});