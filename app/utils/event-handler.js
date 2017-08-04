'use strict';

var EventArguments = require('../models/event-arguments');

var domUtil = require('../utils/dom'),
	tableUtil = require('../utils/table'),
	editUtil = require('../utils/edit'),
	generatorUtil = require('../utils/generator');

var configInstance = require('../instances/configuration');

var container;

function onWheelEventHandler(event) {
	event.preventDefault();

	container.scrollTop += event.deltaY;
	container.scrollLeft += event.deltaX;
}

function onScrollEventHandler() {
	domUtil.resetEditingCell(onInputBlurEventHandler);
	generatorUtil.initBuffers(configInstance);
	domUtil.updateTable();
}

function onInputBlurEventHandler() {
	var cell = this.parentNode,
		rowNumber = domUtil.indexOfElement(cell.parentNode) + configInstance.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + configInstance.inner.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: this.value,
		class: configInstance.selectors.editedCell
	});

	if (!tableUtil.isCellChanged(editedObj)) {
		domUtil.resetEditingCell(onInputBlurEventHandler);

		return;
	}

	var args = new EventArguments({
		cell: cell,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.eventHandlers.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(args.cellObject);
		domUtil.updateCell(args.cell, args.cellObject);

		configInstance.eventHandlers.onAfterEdit(args);
	}
}

function onClickCellEventHandler() {
	if (!configInstance.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(this.parentNode) + configInstance.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(this) - 1 + configInstance.inner.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: this,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.eventHandlers.onBeforeEdit(args);

	if (!args.cancelEvent) {
		this.classList.add(configInstance.selectors.editingCell);
		this.classList.remove(configInstance.selectors.editedCell);
		this.innerHTML = '';
		this.appendChild(input);

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', onInputBlurEventHandler);
	}
}

function addEvents() {
	container = document.querySelector('.' + configInstance.selectors.virtualContainer);

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', onScrollEventHandler);
	}

	if (configInstance.edit.enabled && configInstance.selectors.saveButton !== null) {
		document.querySelector(configInstance.selectors.saveButton).addEventListener('click', editUtil.saveCells);
	}

	if (configInstance.edit.enabled) {
		document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.inner.selectors.dataCell).forEach(function(el) {
			el.addEventListener('click', onClickCellEventHandler);
		});
	}
}

function removeEvents() {
	document.querySelector('.' + configInstance.selectors.virtualContainer).removeEventListener('scroll', onScrollEventHandler);
}

module.exports = {
	onClickCellEventHandler: onClickCellEventHandler,
	addEvents: addEvents,
	removeEvents: removeEvents
};