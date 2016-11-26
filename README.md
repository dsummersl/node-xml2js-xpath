node-xml2js-xpath
=================

A library for [node-xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
that allows querying the JSON object with XPath syntax.

[![build status](https://secure.travis-ci.org/dsummersl/node-xml2js-xpath.png)](http://travis-ci.org/dsummersl/node-xml2js-xpath)

Install
=======

Use npm:

    npm install --save xml2js xml2js-xpath

Usage
=====

To use this library, first you need to some xml2js results to parse. Example:

```javascript
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");

xml2js.parseString('<root><element id="15">target</element></root>', function(err, json) {
  // find all elements: returns xml2js JSON of the element
  var matches = xpath.find(json, "//element");

  // find the first element, and get its id:
  var matches = xpath.evalFirst(json, "//element", "id");
});
```

See test cases for more examples.
