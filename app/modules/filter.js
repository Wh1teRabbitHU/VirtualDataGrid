'use strict';

var domUtil    = require('../utils/dom'),
	domModule  = require('../modules/dom'),
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

	// TODO: Kiszedni a typenál az ellenőrzést ha már lesz default érték header celláknál
	filterObj.attribute = attribute;
	filterObj.type = typeof cellObj.filter == 'undefined' ? 'equals' : cellObj.filter.type || 'equals';
	filterObj.value = filterObj.value || '';

	config.inner.filters[attribute] = filterObj;

	var container = document.createElement('div');

	cell.innerHTML = '';
	cell.appendChild(container);

	container.classList.add(config.inner.selectors.filterContainer);
	container.innerHTML = '<input><i class="' + clearIconElementClass + '" aria-hidden="true"></i>';

	var input = container.querySelector('input');

	input.setAttribute('type', cellObj.type);
	input.value = filterObj.value;
	input.focus();
	input.addEventListener('keyup', function(event) {
		if ((event.keyCode || event.which) === 13) { // Enter key
			filterObj.value = dataUtil.getValueByType(input.value, cellObj.type);

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

		config.dataSource = dataUtil.filterData(config.dataSource, filter.attribute, filter.type, filter.value, filter.valueTwo);
	});

	// TODO: Átírni toggle-ra
	if (config.dataSource.length < config.inner.visibleRowNumber) {
		document.querySelector('.' + config.selectors.virtualContainer).classList.add('no-vertical-scroll');
	} else {
		document.querySelector('.' + config.selectors.virtualContainer).classList.remove('no-vertical-scroll');
	}

	domModule.recalculateDimensions(config);
	domModule.updateBuffers(config);
	domModule.updateTable(config);
}

module.exports = {
	startEditingFilter: startEditingFilter,
	clearFilter: clearFilter
};