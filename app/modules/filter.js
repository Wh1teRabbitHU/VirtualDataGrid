'use strict';

var domUtil    = require('../utils/dom'),
	domModule  = require('../modules/dom'),
	sortModule = require('../modules/sort'),
	dataUtil   = require('../utils/data'),
	configUtil = require('../utils/configuration');

function startEditingFilter(config, cell) {
	if (cell.querySelector('.' + config.inner.selectors.filterContainer) !== null) {
		return;
	}

	var attribute = cell.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute] || {},
		headerObj = configUtil.getHeaderObject(config, attribute),
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	filterObj.attribute = attribute;
	filterObj.filterType = headerObj.filterType;
	filterObj.value = filterObj.value || '';

	config.inner.filters[attribute] = filterObj;

	var container = document.createElement('div');

	domModule.updateCellData(config, cell, container);

	container.classList.add(config.inner.selectors.filterContainer);
	container.innerHTML = '<input><i class="' + clearIconElementClass + '" aria-hidden="true"></i>';

	var input = container.querySelector('input');

	input.setAttribute('type', headerObj.dataType);
	input.value = filterObj.value;
	input.focus();
	input.addEventListener('keyup', function(event) {
		if ((event.keyCode || event.which) === 13) { // Enter key
			filterObj.value = dataUtil.getValueByType(input.value, headerObj.dataType);

			finishEditingFilter(config, cell, headerObj, filterObj);
		} else if ((event.keyCode || event.which) === 27) { // Escape key
			finishEditingFilter(config, cell, headerObj, filterObj);
		}
	});
}

function filter(config, sortTable) {
	sortTable = sortTable !== false;

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

	if (sortTable) {
		sortModule.sort(config, false);
	}

	domModule.recalculateDimensions(config);
	domModule.updateBuffers(config);
	domModule.updateTable(config);
}

function clearFilter(config, cell) {
	var attribute = cell.getAttribute('data-attribute'),
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

	finishEditingFilter(config, cell, cellObj, filterObj);
}

function finishEditingFilter(config, cell, cellObj, filterObj) {
	domModule.updateCellData(config, cell, domUtil.getFilterCellHtml(config, cell, cellObj, filterObj));

	filter(config);
}

module.exports = {
	startEditingFilter: startEditingFilter,
	filter: filter,
	clearFilter: clearFilter
};