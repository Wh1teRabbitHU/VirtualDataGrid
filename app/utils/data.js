'use strict';

var FILTER_TYPES = [ 'equals', 'equalsCaseInsensitive', 'like', 'likeCaseInsensitive', 'greaterThan', 'greaterOrEqual',
	'lessThan', 'lessOrEqual', 'between', 'betweenInclusive', 'contains' ];

function defaultComparator(a, b, options) {
	var attrA = getMergedValue(a, options.attribute, options.editedValues, options.uniqueRowKey),
		attrB = getMergedValue(b, options.attribute, options.editedValues, options.uniqueRowKey),
		isDown = options.direction === 'down';

	if (options.dataType === 'string') {
		var compareResult = attrA.localeCompare(attrB, options.locale);

		return isDown || compareResult === 0 ? compareResult : compareResult * -1;
	} else if (options.dataType === 'number') {
		attrA = parseFloat(attrA);
		attrB = parseFloat(attrB);

		if (isNaN(attrA)) {
			return isDown ? -1 : 1;
		}

		if (isNaN(attrB)) {
			return isDown ? 1 : -1;
		}
	}

	if (typeof attrA == 'undefined' && typeof attrB != 'undefined' || attrA < attrB) {
		return isDown ? -1 : 1;
	}

	if (typeof attrA != 'undefined' && typeof attrB == 'undefined' || attrA > attrB) {
		return isDown ? 1 : -1;
	}

	return 0;
}

function filterData(options) {
	if (FILTER_TYPES.indexOf(options.filterType) === -1) {
		window.console.error('Not a valid filter type! (' + options.filterType + ')');

		return options.dataSource;
	}

	switch (options.filterType) {
		case 'equals':
			return equalsFilter(options);
		case 'equalsCaseInsensitive':
			return equalsCaseInsensitiveFilter(options);
		case 'like':
			return likeFilter(options);
		case 'likeCaseInsensitive':
			return likeCaseInsensitiveFilter(options);
		case 'greaterThan':
			return greaterThanFilter(options);
		case 'greaterOrEqual':
			return greaterOrEqualFilter(options);
		case 'lessThan':
			return lessThanFilter(options);
		case 'lessOrEqual':
			return lessOrEqualFilter(options);
		case 'between':
			return betweenFilter(options);
		case 'betweenInclusive':
			return betweenInclusiveFilter(options);
		case 'contains':
			return containsFilter(options);
		default:
			return options.dataSource;
	}
}

function equalsFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) === options.valueOne;
	});
}

function equalsCaseInsensitiveFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey).toUpperCase() === options.valueOne.toUpperCase();
	});
}

function likeFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey).indexOf(options.valueOne) !== -1;
	});
}

function likeCaseInsensitiveFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey).toUpperCase().indexOf(options.valueOne.toUpperCase()) !== -1;
	});
}

function greaterThanFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) > options.valueOne;
	});
}

function greaterOrEqualFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) >= options.valueOne;
	});
}

function lessThanFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) < options.valueOne;
	});
}

function lessOrEqualFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) <= options.valueOne;
	});
}

function betweenFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) > options.valueOne && obj[options.attribute] < options.valueTwo;
	});
}

function betweenInclusiveFilter(options) {
	return options.dataSource.filter(function(obj) {
		return getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey) >= options.valueOne && obj[options.attribute] <= options.valueTwo;
	});
}

function containsFilter(options) {
	return options.dataSource.filter(function(obj) {
		return options.valueOne.indexOf(getMergedValue(obj, options.attribute, options.editedValues, options.uniqueRowKey)) !== -1;
	});
}

function getValueByType(value, dataType) {
	if (typeof value == 'undefined') {
		return value;
	}

	switch (dataType) {
		case 'string':
			return value.toString();
		case 'number':
			return parseFloat(value);
		default:
			return value;
	}
}

function getMergedValue(row, attribute, editedValues, uniqueRowKey) {
	var editedRow = editedValues[row[uniqueRowKey]];

	return typeof editedRow == 'undefined' || typeof editedRow[attribute] == 'undefined' ? row[attribute] : editedRow[attribute];
}

function cloneObject(obj) {
	return JSON.parse(JSON.stringify(obj));
}

module.exports = {
	defaultComparator: defaultComparator,
	filterData: filterData,
	getValueByType: getValueByType,
	cloneObject: cloneObject
};