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
		rowNumber = domUtil.indexOfElement(cell.parentNode) + configInstance.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + configInstance.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: this.value,
		class: configInstance.editedCellClass
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

	configInstance.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(args.cellObject);
		domUtil.updateCell(args.cell, args.cellObject);

		configInstance.onAfterEdit(args);
	}
}

function onClickCellEventHandler() {
	if (!configInstance.editable) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(this.parentNode) + configInstance.topCellOffset,
		columnNumber = domUtil.indexOfElement(this) - 1 + configInstance.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: this,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.onBeforeEdit(args);

	if (!args.cancelEvent) {
		this.classList.add(configInstance.editingCellClass);
		this.classList.remove(configInstance.editedCellClass);
		this.innerHTML = '';
		this.appendChild(input);

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', onInputBlurEventHandler);
	}
}

function addEvents() {
	container = document.querySelector('.' + configInstance.virtualContainerClass);

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', onScrollEventHandler);
	}

	if (configInstance.editable && configInstance.saveButtonSelector !== null) {
		document.querySelector(configInstance.saveButtonSelector).addEventListener('click', editUtil.saveCells);
	}

	if (configInstance.editable) {
		document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.dataCellClass).forEach(function(el) {
			el.addEventListener('click', onClickCellEventHandler);
		});
	}
}

function removeEvents() {
	document.querySelector('.' + configInstance.virtualContainerClass).removeEventListener('scroll', onScrollEventHandler);
}

module.exports = {
	onClickCellEventHandler: onClickCellEventHandler,
	addEvents: addEvents,
	removeEvents: removeEvents
};