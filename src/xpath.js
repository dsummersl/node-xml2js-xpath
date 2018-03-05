let _ = require("lodash");

const ATTRKEY = '$'
const CHARKEY = '_'

// Definition of an XML name tag: https://www.w3.org/TR/xml/#NT-Name
const NAME_START_CHAR = 'A-Za-z:_\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D' +
	'\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF' +
	'\uF900-\uFDCF\uFDF0-\uFFFD'
const NAME_CHAR = `${NAME_START_CHAR}.0-9·\u0300-\u036F\u203F-\u2040-`
const TAG_NAME = `[${NAME_START_CHAR}][${NAME_CHAR}]*`
const TAG_AND_PROP = `(${TAG_NAME})\\[@([\\w:]+)='([^']+)'\\]`

// Given a JSON document returned by xml2js (with _ and $ keys), return the
// combined text value of the tags.
let jsonText = function(json) {
	if (_.isString(json)) {
		return json;
	}
	let result = json[CHARKEY] || '';
	_.forEach(_.keys(json),function(key) {
		if (key === ATTRKEY || key === CHARKEY) {
			return;
		}
		let value = json[key];
		if (_.isArray(value)) {
			_.forEach(value,function(entry) {
				result += jsonText(entry);
			});
		} else {
			result += jsonText(value);
		}
	});
	return result;
};

let findAllKeys = function(json, key, matches) {
	if (_.isString(json)) {
		return matches;
	}
	_.forEach(_.keys(json),function(jsonKey) {
		if (jsonKey === ATTRKEY || jsonKey === CHARKEY) {
			return;
		}
		if (key === jsonKey && key in json) {
			if (!_.isArray(json[jsonKey])) {
				matches.push(json[jsonKey]);
			} else {
				_.forEach(json[jsonKey], function(val) {
					matches.push(val);
				});
			}
		} else {
			findAllKeys(json[jsonKey], key, matches);
		}
	});
	return matches;
};

let findAllProperties = function(json, property, matches) {
	let foundMatch = false;
	_.forEach(_.keys(json.$),function(jsonProperty) {
		if (property === jsonProperty && property in json.$) {
			matches.push(json);
			foundMatch = true;
		}
	});

	if (!foundMatch) {
		_.forEach(_.keys(json),function(jsonKey) {
			if (jsonKey === ATTRKEY || jsonKey === CHARKEY) {
				return;
			}
			findAllProperties(json[jsonKey], property, matches);
		});
	}

	return matches;
};

// Perform simple search of a xml2js document with XPath.
//
// This function supports simple XPath queries like:
//	* //Element/SubElement
//	* /Element/Subelement/SubSubElement
//	* //Element[@id='4']/SubElement
//	* //Element[@id='4']/@property
//
// Returns an array of matches.
let find = function(json, path) {
	if (path === "") {
		if (!_.isArray(json)) {
			return [json];
		}
		return json;
	}
	if (path.length > 0 && path[0] === ".") {
		path = path.substring(1);
	}

	// match /Element[@key='value']
	let match = path.match(`^\\/${TAG_AND_PROP}`);
	if (match) {
		let node = match[1];
		let key = match[2];
		let value = match[3];
		let newPath = path.replace(`/${node}[@${key}='${value}']`, "");
		if (node in json) {
			if (ATTRKEY in json[node]) {
				if (key in json[node][ATTRKEY] && json[node][ATTRKEY][key] === value) {
					return find(json[node], newPath);
				}
			} else if (_.isArray(json[node])) {
					let results = []
					_.forEach(json[node], function (item) {
						if (ATTRKEY in item && key in item[ATTRKEY] && item[ATTRKEY][key] === value) {
							let hits = find(item, newPath);
							results = results.concat(hits);
						}
					})
					return results;
			}
		}
	}

	// match //Element[@key='value']
	match = path.match(`^\\/\\/${TAG_AND_PROP}`);
	if (match) {
		// see if the current dictionary has a match, for all that do not match, see
		// if their values have matches, etc...
		let node = match[1];
		let key = match[2];
		let value = match[3];
		let newPath = path.replace(`//${node}[@${key}='${value}']`, "");
		let foundKeys = findAllKeys(json, node, []);
		let matches = _.filter(foundKeys, function(val) {
			if (ATTRKEY in val) {
				return key in val[ATTRKEY] && val[ATTRKEY][key] === value;
			}
			return false;
		});
		let results = [];
		_.forEach(matches, function(item) {
			let hits = find(item, newPath);
			results = results.concat(hits);
		});
		return results;
	}

	// match //Element
	match = extractAllKeys(json, path, new RegExp(`^\/\/([${NAME_START_CHAR}][${NAME_CHAR}]*)`));
	if (match) {
		return match;
	}

	// match intermediate /Element/
	match = path.match(`^\\/(${TAG_NAME})\\/`);
	if (match) {
		const node = match[1]
		if (_.isArray(json[node])) {
			let results = []
			json[node].forEach((sub) => results = results.concat(find(sub, path.replace(`/${node}/`, "/"))))
			return results
		} else {
			return find(json[node], path.replace(`/${node}/`, "/"))
		}
	}

	// match leaf /Element
	match = path.match(`^\\/(${TAG_NAME})$`);
	if (match) {
		const node = match[1]
		if (_.has(json, node)) {
			if (_.isArray(json[node])) {
				return json[node]
			} else {
				return [json[node]]
			}
		}
	}

	// match //@property
	match = extractAllProperties(json, path, /^\/\/@([\w:]+)/);
	if (match) {
		return match;
	}

	// match /@property
	match = path.match(/^\/@([\w:]+)/);
	if (match) {
		let matches = [];
		_.forEach(_.keys(json),function(key) {
			if (_.isArray(json[key])) {
				_.forEach(json[key], function(sub) {
					if (_.has(sub,ATTRKEY) && match[1] in sub[ATTRKEY]) {
						matches.push(sub);
					}
				});
			} else {
				if (_.has(json,ATTRKEY) && match[1] in json[ATTRKEY]) {
					matches.push(json);
				}
			}
		});
		return matches;
	}
	return [];
};

let extractAll = function(json, path, pattern, extractFn) {
	let match = path.match(pattern);
	if (match) {
		// see if the current dictionary has a match, for all that do not match, see
		// if their values have matches, etc...
		let newPath = path.replace(pattern, '');
		let matches = extractFn(json, match[1], []);
		let results = [];
		_.forEach(matches, function(value) {
			let matches = find(value, newPath);
			results = results.concat(matches);
		});
		return results;
	}

	return false;
};
let extractAllKeys = _.partialRight(extractAll,findAllKeys);
let extractAllProperties = _.partialRight(extractAll,findAllProperties);

// Use find to search a JSON object.
//
// Parameters:
//	* json	= the JSON document to search (genearted by xml2js)
//	* path	= An XPath search.
//	* fetch = If true, run jsonText() on the output. If a string, try to return
//						the tag property. If not supplied, return the node.
//
// Returns a node (one with no attributes and a null value if no match)
// If more than one match is found, the first is returned.
let evalFirst = function(json, path, fetch) {
	let matches = find(json, path);
	if (matches.length === 0) {
		if (fetch) {
			return undefined;
		}
		return undefined;
	}
	// searches like //Somehting/SomethingElse return nested arrays
	matches = matches[0];
	if (_.isArray(matches)) {
		matches = matches[0];
	}
	if (fetch === true) {
		return jsonText(matches);
	}
	if (_.isString(fetch)) {
		if (ATTRKEY in matches && fetch in matches[ATTRKEY]) {
			return matches[ATTRKEY][fetch];
		}
		return undefined;
	}
	return matches;
};

module.exports.evalFirst = evalFirst;
module.exports.find = find;
module.exports.jsonText = jsonText;
