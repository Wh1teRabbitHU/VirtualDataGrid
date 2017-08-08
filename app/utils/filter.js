'use strict';

var domUtil = require('./dom');

function startEditingFilter(config, cell) {
	if (cell.querySelector('.' + config.inner.selectors.filterContainer) !== null) {
		return;
	}

	var attribute = cell.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute] || {},
		innerHTML = '',
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass,
		type = cell.getAttribute('data-type'),
		container = document.createElement('div');

	innerHTML += '<i class="' + clearIconElementClass + '" aria-hidden="true"></i>';

	container.classList.add(config.inner.selectors.filterContainer);

	cell.innerHTML = '';
	cell.appendChild(container);

	container.appendChild(document.createElement('input'));
	container.innerHTML += innerHTML;

	var input = container.querySelector('input');

	input.setAttribute('type', type);
	input.value = filterObj.value || '';
	input.focus();
	input.addEventListener('keyup', function(event) {
		if ((event.keyCode || event.which) === 13) {
			finishEditingFilter(config, cell);
		} else if ((event.keyCode || event.which) === 27) {
			cancelFiltering(config, cell);
		}
	});
}

function finishEditingFilter(config, cell) {
	var attribute = cell.getAttribute('data-attribute'),
		input = cell.querySelector('input'),
		value = input === null ? '' : input.value,
		filterObj = config.inner.filters[attribute];

	if (typeof filterObj == 'undefined') {
		config.inner.filters[attribute] = {};
		filterObj = config.inner.filters[attribute];
	}

	filterObj.value = value;
	cell.innerHTML = getFilterCellHtml(config, cell, filterObj);
	config.dataSource = config.inner.originalDataSource;

	Object.keys(config.inner.filters).forEach(function(key) {
		var filter = config.inner.filters[key];

		if (typeof filter.value == 'undefined' || filter.value === '') {
			return;
		}

		config.dataSource = config.dataSource.filter(function(row) {
			return row[key].toString() === filter.value;
		});
	});

	// TODO: Átírni toggle-ra
	if (config.dataSource.length < config.inner.visibleRowNumber) {
		document.querySelector('.' + config.selectors.virtualContainer).classList.add('no-vertical-scroll');
	} else {
		document.querySelector('.' + config.selectors.virtualContainer).classList.remove('no-vertical-scroll');
	}

	domUtil.recalculateDimensions(config);
	domUtil.updateBuffers(config);
	domUtil.updateTable(config);
}

function cancelFiltering(config, cell) {
	var attribute = cell.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute],
		input = cell.querySelector('input');

	input.value = filterObj.value || '';

	finishEditingFilter(config, cell);
}

function clearFilter(config, cell) {
	var attribute = cell.getAttribute('data-attribute'),
		filterObj = config.inner.filters[attribute],
		input = cell.querySelector('input');

	if (input !== null) {
		input.value = '';
	}

	if (typeof filterObj != 'undefined') {
		filterObj.value = '';
	}

	finishEditingFilter(config, cell);
}

// TODO: A duplikációt megszüntetni. Erre akkor lesz lehetőség, ha a modules és utils fájlok szét lesznek bontva a körkörös dependencia miatt
function getFilterCellHtml(config, cell, filterObj) {
	var innerHTML = '',
		iconClass = config.inner.icons.filter.search,
		iconElementClass = config.inner.selectors.filterSearchIcon + ' ' + iconClass,
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';
	innerHTML += filterObj.value || '';

	if (typeof filterObj.value != 'undefined' && filterObj.value !== '') {
		innerHTML += '<i class="' + clearIconElementClass + '" aria-hidden="true"></i>';
	}

	return innerHTML;
}

module.exports = {
	startEditingFilter: startEditingFilter,
	finishEditingFilter: finishEditingFilter,
	clearFilter: clearFilter
};