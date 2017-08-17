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
		cellObj = configUtil.getCellObject(config, attribute),
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	filterObj.attribute = attribute;
	filterObj.filterType = cellObj.filterType;
	filterObj.value = filterObj.value || '';

	config.inner.filters[attribute] = filterObj;

	var container = document.createElement('div');

	cell.innerHTML = '';
	cell.appendChild(container);

	container.classList.add(config.inner.selectors.filterContainer);
	container.innerHTML = '<input><i class="' + clearIconElementClass + '" aria-hidden="true"></i>';

	var input = container.querySelector('input');

	input.setAttribute('type', cellObj.dataType);
	input.value = filterObj.value;
	input.focus();
	input.addEventListener('keyup', function(event) {
		if ((event.keyCode || event.which) === 13) { // Enter key
			filterObj.value = dataUtil.getValueByType(input.value, cellObj.dataType);

			finishEditingFilter(config, cell, filterObj);
		} else if ((event.keyCode || event.which) === 27) { // Escape key
			finishEditingFilter(config, cell, filterObj);
		}
	});
}

function clearFilter(config, cell) {
	var attribute = cell.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute];

	filterObj.value = '';

	finishEditingFilter(config, cell, filterObj);
}

function finishEditingFilter(config, cell, filterObj) {
	cell.innerHTML = domUtil.getFilterCellHtml(config, cell, filterObj);
	config.dataSource = config.inner.originalDataSource;

	Object.keys(config.inner.filters).forEach(function(key) {
		var filter = config.inner.filters[key];

		if (typeof filter.value == 'undefined' || filter.value === '') {
			return;
		}

		if (filter.filterType === 'custom') {
			if (config.filter.customFilter !== null) {
				config.dataSource = config.filter.customFilter(config.dataSource, filter.attribute, filter.value);
			}
		} else {
			config.dataSource = dataUtil.filterData(config.dataSource, filter.attribute, filter.filterType, filter.value, filter.valueTwo);
		}
	});

	var smallerTable = config.dataSource.length < config.inner.visibleRowNumber;

	document.querySelector('.' + config.selectors.virtualContainer).classList.toggle('no-vertical-scroll', smallerTable);

	sortModule.sort(config, false);

	domModule.recalculateDimensions(config);
	domModule.updateBuffers(config);
	domModule.updateTable(config);
}

module.exports = {
	startEditingFilter: startEditingFilter,
	clearFilter: clearFilter
};