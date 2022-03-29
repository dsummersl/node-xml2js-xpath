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

  // Extract text representation of XML document:
  assert xpath.jsonText(json) === 'target';
});
```

See test cases for more examples.

XPath Support
=============

This project supports a subset of the [the XPath standard](https://www.w3.org/TR/1999/REC-xpath-19991116/):

- [X] Descendent selectors (`//h`, `/parent/offspring`).
- [X] Attribute selectors (`/parent/offspring[@attribute='value']`).
- [X] Tag value selectors (`/parent[offspring='value']`).
- [X] Order predicate (`/parent/offspring[1]`)

Notable unsupported features:
- [ ] Arithmetic comparisons (`/parent/offspring[@attribute > 12.5]`)
- [ ] Boolean logic (`/parent/offspring[@attribute1 or @attribute2]`)
- [ ] Axes (`/parent/following-sibling::offspring`)
- [ ] Functions ( `last()`, `starts-with()`, `contains()`, `text()`, etc).


https://www.w3.org/TR/1999/REC-xpath-19991116

https://codebeautify.org/Xpath-Tester
