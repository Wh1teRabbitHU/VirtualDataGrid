'use strict';

var tableModule   = require('../modules/table'),
	sortModule    = require('../modules/sort'),
	dataUtil      = require('../utils/data'),
	configUtil    = require('../utils/configuration'),
	cellElement   = require('../elements/cell'),
	filterElement = require('../elements/filter');

function startEditingFilter(config, cellNode) {
	if (cellNode.querySelector('.' + config.inner.selectors.filterContainer) !== null) {
		return;
	}

	var attribute = cellNode.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute] || {},
		headerObj = configUtil.getHeaderObject(config, attribute);

	filterObj.attribute = attribute;
	filterObj.dataType = headerObj.dataType;
	filterObj.filterType = headerObj.filterType;
	filterObj.value = filterObj.value || '';

	config.inner.filters[attribute] = filterObj;

	var filterContainer = filterElement.createContainer(config);

	cellElement.updateDataContainer(config, cellNode, filterContainer);

	var filterInput = filterElement.updateInput(config, cellNode, filterObj, headerObj, finishEditingFilter);

	filterInput.focus();
}

function filter(config, sortAfterFiltering) {
	sortAfterFiltering = sortAfterFiltering !== false;

	config.dataSource = config.inner.originalDataSource;

	Object.keys(config.inner.filters).forEach(function(key) {
		var filterObj = config.inner.filters[key];

		if (typeof filterObj.value == 'undefined' || filterObj.value === '') {
			return;
		}

		if (filterObj.filterType === 'custom') {
			if (config.filter.customFilter !== null) {
				config.dataSource = config.filter.customFilter({
					dataSource: config.dataSource,
					attribute: filterObj.attribute,
					value: filterObj.value,
					editedValues: config.inner.editedValues,
					uniqueRowKey: config.uniqueRowKey
				});
			}
		} else {
			config.dataSource = dataUtil.filterData({
				dataSource: config.dataSource,
				attribute: filterObj.attribute,
				filterType: filterObj.filterType,
				valueOne: filterObj.value,
				valueTwo: filterObj.valueTwo,
				editedValues: config.inner.editedValues,
				uniqueRowKey: config.uniqueRowKey
			});
		}
	});

	filterOutEmptyRows(config);

	if (sortAfterFiltering) {
		sortModule.sort(config, false);
	}

	tableModule.updateTable(config);
}

function clearFilter(config, cellNode) {
	var attribute = cellNode.getAttribute('data-attribute'),
		cellObj = configUtil.getHeaderObject(config, attribute),
		filterObj = config.inner.filters[attribute];

	filterObj.value = '';

	var newFilters = {};

	Object.keys(config.inner.filters).forEach(function(key) {
		if (key !== attribute) {
			newFilters[key] = config.inner.filters[key];
		}
	});

	config.inner.filters = newFilters;

	finishEditingFilter(config, cellNode, cellObj, filterObj);
}

function finishEditingFilter(config, cellNode, cellObj, filterObj) {
	cellElement.updateDataContainer(config, cellNode, cellElement.createFilterData(config, cellNode, cellObj, filterObj));

	filter(config);
}

function filterOutEmptyRows(config) {
	var dsLength = config.dataSource.length;

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.classList.toggle(config.inner.selectors.filteredOutRow, dsLength <= rowNumber);
	});

	// Fixed cell data row update
	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.classList.toggle(config.inner.selectors.filteredOutRow, dsLength <= rowNumber);
	});
}

module.exports = {
	startEditingFilter: startEditingFilter,
	filter: filter,
	clearFilter: clearFilter
};