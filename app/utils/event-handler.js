'use strict';

var EventArguments = require('../models/event-arguments');

var domUtil = require('../utils/dom'),
	tableUtil = require('../utils/table'),
	editUtil = require('../utils/edit'),
	generatorUtil = require('../utils/generator'),
	sortUtil = require('../utils/sort');

var container;

var instances = {
	onScrollEventHandler: function() {},
	onInputBlurEventHandler: function() {},
	onClickCellEventHandler: function() {},
	onClickSaveButtonEventHandler: function() {}
};

function onWheelEventHandler(event) {
	event.preventDefault();

	container.scrollTop += event.deltaY;
	container.scrollLeft += event.deltaX;
}

function onScrollEventHandler(event, config) {
	domUtil.resetEditingCell(config, instances.onInputBlurEventHandler);
	generatorUtil.initBuffers(config);
	domUtil.updateTable(config);
}

function onInputBlurEventHandler(event, config) {
	var cell = event.target.parentNode,
		rowNumber = domUtil.indexOfElement(cell.parentNode) + config.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + config.inner.leftCellOffset,
		editedObj = tableUtil.getCell(config, rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: event.target.value,
		class: config.selectors.editedCell
	});

	if (!tableUtil.isCellChanged(config, editedObj)) {
		domUtil.resetEditingCell(config, instances.onInputBlurEventHandler);

		return;
	}

	var args = new EventArguments({
		cell: cell,
		cellObject: editedObj,
		cancelEvent: false
	});

	config.eventHandlers.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(config, args.cellObject);
		domUtil.updateCell(config, args.cell, args.cellObject);

		config.eventHandlers.onAfterEdit(args);
	}
}

function onClickCellEventHandler(event, config) {
	if (!config.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(event.target.parentNode) + config.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(event.target) - 1 + config.inner.leftCellOffset,
		editedObj = tableUtil.getCell(config, rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: event.target,
		cellObject: editedObj,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeEdit(args);

	if (!args.cancelEvent) {
		event.target.classList.add(config.selectors.editingCell);
		event.target.classList.remove(config.selectors.editedCell);
		event.target.innerHTML = '';
		event.target.appendChild(input);

		instances.onInputBlurEventHandler = function(ev) { onInputBlurEventHandler(ev, config); };

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', instances.onInputBlurEventHandler);
	}
}

function onClickSaveButtonEventHandler(event, config) {
	editUtil.saveCells(config);
}

function onClickSortHeader(event, config) {
	var sortColumnSelector = '.' + config.inner.selectors.sortColumn,
		sortIconSelector = sortColumnSelector + ' .' + config.inner.selectors.sortIcon;

	if (!event.target.matches(sortColumnSelector) &&
		!event.target.matches(sortIconSelector)) {
		return;
	}

	if (event.target.matches(sortIconSelector)) {
		sortUtil.sortByColumn(config, event.target.parentNode);
	}

	if (event.target.matches(sortColumnSelector)) {
		sortUtil.sortByColumn(config, event.target);
	}
}

function addEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	instances.onScrollEventHandler = function(event) { onScrollEventHandler(event, config); };
	instances.onClickCellEventHandler = function(event) { onClickCellEventHandler(event, config); };
	instances.onClickSaveButtonEventHandler = function(event) { onClickSaveButtonEventHandler(event, config); };
	instances.onClickSortHeader = function(event) { onClickSortHeader(event, config); };

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).addEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.addEventListener('click', instances.onClickCellEventHandler);
		});
	}

	if (config.sort.enabled) {
		document.addEventListener('click', instances.onClickSortHeader);
	}
}

function removeEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	if (container !== null) {
		container.removeEventListener('wheel', onWheelEventHandler);
		container.removeEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).removeEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.removeEventListener('click', instances.onClickCellEventHandler);
		});
	}

	if (config.sort.enabled) {
		document.removeEventListener('click', instances.onClickSortHeader);
	}
}

module.exports = {
	addEvents: addEvents,
	removeEvents: removeEvents
};