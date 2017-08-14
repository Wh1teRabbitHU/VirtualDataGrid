'use strict';

var domModule  = require('../modules/dom'),
	configUtil = require('../utils/configuration'),
	dataUtil   = require('../utils/data');

function sortByColumn(config, column) {
	var attribute = column.getAttribute('data-attribute'),
		columnObj = configUtil.getCellObject(config, attribute),
		direction = 'up';

	if (config.inner.sort.attribute === attribute &&
		config.inner.sort.direction === 'up') {

		direction = 'down';
	}

	config.inner.sort.direction = direction;
	config.inner.sort.attribute = attribute;
	config.inner.sort.type = columnObj.type;

	sort(config);
}

function sort(config) {
	config.dataSource.sort(function(a, b) {
		if (config.sort.comparator !== null) {
			return config.sort.comparator(a, b, {
				attribute: config.inner.sort.attribute,
				direction: config.inner.sort.direction,
				type: config.inner.sort.type
			});
		}

		var attribute = config.inner.sort.attribute || config.sort.default,
			direction = typeof config.inner.sort.direction == 'undefined' ? 'down' : config.inner.sort.direction,
			type = getSortType(config, config.sort.default);

		return dataUtil.defaultComparator(a, b, {
			attribute: attribute,
			direction: direction,
			type: type,
			name: config.locale.name
		});
	});

	domModule.updateTable(config);
}

function resetSort(config) {
	config.inner.sort.direction = '';
	config.inner.sort.attribute = '';
	config.inner.sort.type = '';
	config.dataSource.sort(function(a, b) {
		if (config.sort.comparator !== null) {
			return config.sort.comparator(a, b, config.sort.default, 'down');
		}

		return dataUtil.defaultComparator(a, b, {
			attribute: config.sort.default,
			direction: 'down',
			type: getSortType(config, config.sort.default),
			name: config.locale.name
		});
	});

	domModule.updateTable(config);
}

function getSortType(config, attribute) {
	return configUtil.getCellObject(config, attribute).type || 'string';
}

module.exports = {
	sortByColumn: sortByColumn,
	sort: sort,
	resetSort: resetSort
};