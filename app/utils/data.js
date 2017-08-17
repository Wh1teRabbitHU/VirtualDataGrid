'use strict';

var FILTER_TYPES = [ 'equals', 'equalsCaseInsensitive', 'like', 'likeCaseInsensitive', 'greaterThan', 'greaterOrEqual',
	'lessThan', 'lessOrEqual', 'between', 'betweenInclusive', 'contains' ];

function defaultComparator(a, b, options) {
	var attrA = a[options.attribute],
		attrB = b[options.attribute],
		isDown = options.direction === 'down';

	if (options.dataType === 'string') {
		var compareResult = attrA.localeCompare(attrB, options.locale);

		return isDown || compareResult === 0 ? compareResult : compareResult * -1;
	} else if (options.dataType === 'number') {
		var attrANumb = parseFloat(attrA),
			attrBNumb = parseFloat(attrB);

		if (!isNaN(attrANumb)) {
			attrA = attrANumb;
		}

		if (!isNaN(attrBNumb)) {
			attrB = attrBNumb;
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

function filterData(data, attribute, filterType, valueOne, valueTwo) {
	if (FILTER_TYPES.indexOf(filterType) === -1) {
		window.console.error('Not a valid filter type! (' + filterType + ')');

		return data;
	}

	switch (filterType) {
		case 'equals':
			return equalsFilter(data, attribute, valueOne);
		case 'equalsCaseInsensitive':
			return equalsCaseInsensitiveFilter(data, attribute, valueOne);
		case 'like':
			return likeFilter(data, attribute, valueOne);
		case 'likeCaseInsensitive':
			return likeCaseInsensitiveFilter(data, attribute, valueOne);
		case 'greaterThan':
			return greaterThanFilter(data, attribute, valueOne);
		case 'greaterOrEqual':
			return greaterOrEqualFilter(data, attribute, valueOne);
		case 'lessThan':
			return lessThanFilter(data, attribute, valueOne);
		case 'lessOrEqual':
			return lessOrEqualFilter(data, attribute, valueOne);
		case 'between':
			return betweenFilter(data, attribute, valueOne, valueTwo);
		case 'betweenInclusive':
			return betweenInclusiveFilter(data, attribute, valueOne, valueTwo);
		case 'contains':
			return containsFilter(data, attribute, valueOne);
		default:
			return data;
	}
}

function equalsFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute] === value;
	});
}

function equalsCaseInsensitiveFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute].toUpperCase() === value.toUpperCase();
	});
}

function likeFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute].indexOf(value) !== -1;
	});
}

function likeCaseInsensitiveFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute].toUpperCase().indexOf(value.toUpperCase()) !== -1;
	});
}

function greaterThanFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute] > value;
	});
}

function greaterOrEqualFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute] >= value;
	});
}

function lessThanFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute] < value;
	});
}

function lessOrEqualFilter(data, attribute, value) {
	return data.filter(function(obj) {
		return obj[attribute] <= value;
	});
}

function betweenFilter(data, attribute, valueOne, valueTwo) {
	return data.filter(function(obj) {
		return obj[attribute] > valueOne && obj[attribute] < valueTwo;
	});
}

function betweenInclusiveFilter(data, attribute, valueOne, valueTwo) {
	return data.filter(function(obj) {
		return obj[attribute] >= valueOne && obj[attribute] <= valueTwo;
	});
}

function containsFilter(data, attribute, array) {
	return data.filter(function(obj) {
		return array.indexOf(obj[attribute]) !== -1;
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

module.exports = {
	defaultComparator: defaultComparator,
	filterData: filterData,
	getValueByType: getValueByType
};