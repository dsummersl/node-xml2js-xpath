var xpath = require('./../xpath');
var expect = require('chai').expect;
var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
var _ = require('lodash');


var NAMESPACES = {
    z: 'domain.a/A',
    y: 'domain.b/B',
    x: 'domain.c/C'
};


describe("xpath (with namespaces)", function() {
    var filepath = path.join('test', 'fixtures', 'withNamespaces.xml');
    var file = fs.readFileSync(filepath);

    describe("evalFirstNS()", function() {
        it.skip("should be defined", function() {
            expect(xpath).to.have.property('evalFirstNS').to.be.a('function');
        });

        it.skip("should accept 4 params", function() {
            expect(xpath.evalFirstNS).to.have.lengthOf(4);
        });

        it.skip("returns empty node when stuff isn't found", function(done) {
            parseString(file, function(err, json) {
                var match = xpath.evalFirstNS(NAMESPACES, json, '$..Junk');
                expect(match).to.be.undefined;
                done();
            });
        });

        it.skip("returns empty node when wrong NS", function(done) {
            parseString(file, function(err, json) {
                var match = xpath.evalFirstNS(NAMESPACES, json, '//x:Root');
                expect(match).to.be.undefined;
                done();
            });
        });

        it("returns the first element if there are many", function(done) {
            parseString(file, function(err, json) {
                var match = xpath.evalFirstNS(NAMESPACES, json, '//x:Tracking/y:URL');
                expect(match._.trim()).to.equal("http://serverland.net/ad/start");
                done();
            });
        });

        it("returns the text of the found node when fetch=true", function(done) {
            parseString(file, function(err, json) {
                var match = xpath.evalFirstNS(NAMESPACES, json, '//x:Tracking/y:URL', true);
                expect(match.trim()).to.equal("http://serverland.net/ad/start");
                done();
            });
        });

        it("returns the property of the found node when fetch='name'", function(done) {
            parseString(file, function(err, json) {
                var match = xpath.evalFirstNS(NAMESPACES, json, '//x:Tracking/y:URL', 'id');
                expect(match).to.equal("number0");
            });
        });
    });
});
