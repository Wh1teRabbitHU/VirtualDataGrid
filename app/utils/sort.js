'use strict';

var domUtil = require('./dom');

function defaultCompare(a, b, attribute, isDown) {
	var attrA = a[attribute],
		attrB = b[attribute];

	if (typeof attrA == 'undefined' && typeof attrB != 'undefined' || attrA < attrB) {
		return isDown ? -1 : 1;
	}

	if (typeof attrA != 'undefined' && typeof attrB == 'undefined' || attrA > attrB) {
		return isDown ? 1 : -1;
	}

	return 0;
}

function sortByColumn(config, column) {
	var direction = column.getAttribute('data-direction'),
		attribute = column.getAttribute('data-attribute');

	if (direction === 'none' || direction === 'down') {
		direction = 'up';
	} else {
		direction = 'down';
	}

	config.inner.sort.direction = direction;
	config.inner.sort.attribute = attribute;
	config.dataSource.sort(function(a, b) { return defaultCompare(a, b, attribute, direction === 'down'); });

	domUtil.updateTable(config);
}

function resetSort(config) {
	if (typeof config.sort.default == 'undefined') {
		return;
	}

	config.inner.sort.direction = 'asc';
	config.inner.sort.attribute = config.sort.default;
	config.dataSource.sort(function(a, b) { return defaultCompare(a, b, config.sort.default, true); });

	domUtil.updateTable(config);
}

module.exports = {
	sortByColumn: sortByColumn,
	resetSort: resetSort
};