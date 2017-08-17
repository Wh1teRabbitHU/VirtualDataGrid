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
	config.inner.sort.dataType = columnObj.dataType;

	sort(config);
}

function sort(config, updateTable) {
	updateTable = updateTable !== false;

	config.dataSource.sort(function(a, b) {
		if (config.sort.customSort !== null) {
			return config.sort.customSort(a, b, {
				attribute: config.inner.sort.attribute,
				direction: config.inner.sort.direction,
				dataType: config.inner.sort.dataType
			});
		}

		var attribute = config.inner.sort.attribute || config.sort.default,
			direction = config.inner.sort.direction || 'down',
			dataType = config.inner.sort.dataType || getSortType(config, config.sort.default);

		return dataUtil.defaultComparator(a, b, {
			attribute: attribute,
			direction: direction,
			dataType: dataType,
			name: config.locale.name
		});
	});

	if (updateTable) {
		domModule.updateTable(config);
	}
}

function resetSort(config) {
	config.inner.sort.attribute =
	config.inner.sort.direction =
	config.inner.sort.dataType = undefined; // eslint-disable-line no-undefined

	config.dataSource.sort(function(a, b) {
		if (config.sort.customSort !== null) {
			return config.sort.customSort(a, b, {
				attribute: config.sort.default,
				direction: 'down',
				dataType: getSortType(config, config.sort.default)
			});
		}

		return dataUtil.defaultComparator(a, b, {
			attribute: config.sort.default,
			direction: 'down',
			dataType: getSortType(config, config.sort.default),
			name: config.locale.name
		});
	});

	domModule.updateTable(config);
}

function getSortType(config, attribute) {
	return configUtil.getCellObject(config, attribute).dataType || 'string';
}

module.exports = {
	sortByColumn: sortByColumn,
	sort: sort,
	resetSort: resetSort
};