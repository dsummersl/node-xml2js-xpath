var xpath = require('./xpath');
var expect = require('chai').expect;
var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
var _ = require("lodash");

describe('xpath (with namespaces)', function() {
  var filepath = path.join('src', 'fixtures', 'withNamespaces.xml');
  var file = fs.readFileSync(filepath);
  var json = null;

  before(function(done) {
    parseString(file, function(err, parsedJson) {
      json = parsedJson;
      done();
    });
  });

  describe('evalFirst()', function() {
    it('should accept 3 params', function() {
      expect(xpath.evalFirst).to.have.lengthOf(3);
    });

    it("returns empty node when stuff isn't found", function() {
      var match = xpath.evalFirst(json, '$..Junk');
      expect(match).to.be.undefined;
    });

    it('returns empty node when wrong NS', function() {
      var match = xpath.evalFirst(json, '//x:Root');
      expect(match).to.be.undefined;
    });

    it('returns the first element if there are many', function() {
      var match = xpath.evalFirst(json, '//c:Tracking/b:URL');
      expect(match._.trim()).to.equal('http://serverland.net/ad/start');
    });

    it('returns the text of the found node when fetch=true', function() {
      var match = xpath.evalFirst(json, '//c:Tracking/b:URL', true);
      expect(match.trim()).to.equal('http://serverland.net/ad/start');
    });

    it("returns the property of the found node when fetch='name'", function() {
      var match = xpath.evalFirst(json, '//c:Tracking/b:URL', 'id');
      expect(match.trim()).to.equal('number0');
    });
  });
});
