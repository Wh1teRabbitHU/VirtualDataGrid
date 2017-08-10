'use strict';

var domModule = require('../modules/dom');

function defaultComparator(a, b, attribute, isDown) {
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
	var attribute = column.getAttribute('data-attribute'),
		direction = 'up';

	if (config.inner.sort.attribute === attribute &&
		config.inner.sort.direction === 'up') {

		direction = 'down';
	}

	config.inner.sort.direction = direction;
	config.inner.sort.attribute = attribute;

	sort(config);
}

function sort(config) {
	config.dataSource.sort(function(a, b) {
		if (config.sort.comparator !== null) {
			return config.sort.comparator(a, b, config.inner.sort.attribute, config.inner.sort.direction);
		}

		return defaultComparator(a, b, config.inner.sort.attribute, config.inner.sort.direction === 'down');
	});

	domModule.updateTable(config);
}

function resetSort(config) {
	config.inner.sort.direction = '';
	config.inner.sort.attribute = '';
	config.dataSource.sort(function(a, b) {
		if (config.sort.comparator !== null) {
			return config.sort.comparator(a, b, config.sort.default, 'down');
		}

		return defaultComparator(a, b, config.sort.default, true);
	});

	domModule.updateTable(config);
}

module.exports = {
	sortByColumn: sortByColumn,
	sort: sort,
	resetSort: resetSort
};