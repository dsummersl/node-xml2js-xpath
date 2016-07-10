var xpath = require("../xpath");
var expect = require('chai').expect;
var fs = require("fs");
var parseString = require('xml2js').parseString;
var _ = require("lodash");

describe("xpath", function() {
	var file = fs.readFileSync("test/fixtures/blockOfStreets.xml");

	describe("evalFirst()", function() {
		it("returns empty node when stuff isn't found.", function(done) {
			parseString(file, function (err, json) {
				var match = xpath.evalFirst(json,'$..Junk');
				expect(match).to.equal(undefined);
				done();
			});
		});

		it("returns the first element if there are many", function(done) {
			parseString(file, function (err, json) {
				var match = xpath.evalFirst(json,'//Tracking/URL');
				expect(match._.trim()).to.equal("http://serverland.net/ad/start");
				done();
			});
		});

		it("returns the text of the found node when fetch=true", function(done) {
			parseString(file, function (err, json) {
				var match = xpath.evalFirst(json,'//Tracking/URL',true);
				expect(match.trim()).to.equal("http://serverland.net/ad/start");
				done();
			});
		});

		it("returns the property of the found node when fetch='name'", function(done) {
			parseString(file, function (err, json) {
				var match = xpath.evalFirst(json,'//Tracking/URL','id');
				expect(match).to.equal("number0");
				done();
			});
		});
	});

	describe("jsonText()", function() {
		var parseString = require('xml2js').parseString;

		it("returns nothing when there is nothing", function(done) {
			parseString("<vast/>", function(err, json) {
				expect(xpath.jsonText(json)).to.equal("");
				done();
			});
		});

		it("returns text of a simple doc", function(done) {
			parseString('<vast><val id="3">value</val></vast>', function(err, json) {
				expect(err).to.equal(null);
				expect(xpath.jsonText(json)).to.equal("value");
				done();
			});
		});

		it("returns all values concated", function(done) {
			parseString('<vast><val>value</val><nest><val>2</val></nest></vast>', function(err, json) {
				expect(err).to.equal(null);
				expect(xpath.jsonText(json)).to.equal("value2");
				done();
			});
		});
	});

	describe("find()", function() {
		it("can find /\\w+ patterns", function(done) {
			parseString("<vast/>", function(err, json) {
				expect(xpath.find(json,"/vast")).to.deep.equal([""]);
				expect(xpath.find(json,"/nothing")).to.deep.equal([]);
				done();
			});
		});

		it("can find /\\w+[@val=val] patterns", function(done) {
			parseString('<val id="3">value</val>', function(err, json) {
				expect(xpath.find(json,"/val[@id='3']")).to.deep.equal([{ "_": "value", "$": { "id": "3" } }]);
				done();
			});
		});

		it("can find //\\w+ patterns", function(done) {
			parseString("<vast><one><val/></one><val/><two></two></vast>", function(err, json) {
				expect(xpath.find(json,"//val")).to.deep.equal(["", ""]);
				expect(xpath.find(json,"/nothing")).to.deep.equal([]);
				done();
			});
		});

		it("can find //\\w+/\\w+[@val=val] patterns", function(done) {
			parseString('<vast><one id="3"><val/></one><val/><two></two></vast>', function(err, json) {
				expect(xpath.find(json,"//one[@id='3']/val")).to.deep.equal([""]);
				done();
			});
		});

		it("can find //@\\w+ patterns", function(done) {
			parseString('<vast><one id="3"><val/></one><val/><two></two></vast>', function(err, json) {
				expect(xpath.find(json,"//@id")).to.deep.equal([{ "$": { "id": "3" }, "val": [""] }]);
				done();
			});
		});

		it("can find //\\w+/@\\w+ patterns", function(done) {
			parseString('<vast><one id="3"><val/></one><val/><two></two></vast>', function(err, json) {
				expect(xpath.find(json,"//vast/@id")).to.deep.equal([{ "$": { "id": "3" }, "val": [""] }]);
				done();
			});
		});

		it("matches Vast1Ad searches", function(done) {
			parseString(file, function(err, json) {
				var matches = xpath.find(json,".//Tracking[@event='start']/URL");
				expect(matches.length).to.equal(1);
				expect(xpath.jsonText(matches[0]).trim()).to.equal("http://serverland.net/ad/start");
				done();
			});
		});

		var parseString = require('xml2js').parseString;

		it("CDATAURLS/URL", function(done) {
			parseString(file, function (err, json) {
				expect(err).to.equal(null);
				expect(xpath.find(json,".//CDATAURLS/URL").length).to.equal(1);
				expect(xpath.find(json,".//CDATAURLS/URL")[0]._).to.equal("\n\t\t\t\t\thttp://www.primarysite.com/tracker?imp\n\t\t\t\t");
				done();
			});
		});

		it("CDATAURLS/URL", function(done) {
			parseString(file, function (err, json) {
				expect(err).to.equal(null);
				expect(xpath.find(json,"//CDATAURLS").length).to.equal(1);
				expect(xpath.jsonText(xpath.find(json,"//CDATAURLS")[0])).to.equal("\n\t\t\t\t\thttp://www.primarysite.com/tracker?imp\n\t\t\t\t");
				done();
			});
		});

		it("Tracking[@event=midpoint]", function(done) {
			parseString(file, function (err, json) {
				expect(err).to.equal(null);
				expect(xpath.find(json,".//Tracking[@event='midpoint']").length).to.equal(1);
				expect(xpath.jsonText(xpath.find(json,".//Tracking[@event='midpoint']")[0])).to.equal("\n\t\t\t\t\t\thttp://serverland.net/ad/midpoint\n\t\t\t\t\t");
				done();
			});
		});

		it("Tracking[@event=midpoint]/URL", function(done) {
			parseString(file, function (err, json) {
				expect(err).to.equal(null);
				expect(xpath.find(json,".//Tracking[@event='midpoint']/URL").length).to.equal(1);
				expect(xpath.jsonText(xpath.find(json,".//Tracking[@event='midpoint']/URL")[0])).to.equal("\n\t\t\t\t\t\thttp://serverland.net/ad/midpoint\n\t\t\t\t\t");
				done();
			});
		});

    it('can find /vast/nest/val', function(done) {
			parseString('<vast><nest><val>2</val></nest></vast>', function(err, json) {
				expect(xpath.find(json,'/vast/nest/val').length).to.equal(1);
				expect(xpath.jsonText(xpath.find(json,'/vast/nest/val')[0])).to.equal('2');
				done();
			});
    });
		// //Wrapper/URL should not match //Wrapper/URLS
    it('can not find //Wrapper/URL', function(done) {
			parseString(file, function(err, json) {
				expect(xpath.find(json,'//Wrapper/URL').length).to.equal(0);
				done();
			});
    });

		// //Wrapper/URL should not match //Wrapper/URLS
    it('can find one //Wrapper/URLS', function(done) {
			parseString(file, function(err, json) {
				expect(xpath.find(json,'//Wrapper/URLS').length).to.equal(1);
				done();
			});
    });

		// //Wrapper/URL should not match //Wrapper/TrackingEvents/Tracking/URL
    it('can find three //Wrapper/TrackingEvents/Tracking/URL', function(done) {
			parseString(file, function(err, json) {
				expect(xpath.find(json,'//Wrapper/TrackingEvents/Tracking/URL').length).to.equal(3);
				done();
			});
    });

		// ..but //Wrapper//URL should
    it('can find five //Wrapper//URL', function(done) {
			parseString(file, function(err, json) {
				expect(xpath.find(json,'//Wrapper//URL').length).to.equal(5);
				done();
			});
    });
	});
});
