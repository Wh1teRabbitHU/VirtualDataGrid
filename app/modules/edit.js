'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil      = require('../utils/table'),
	domUtil        = require('../utils/dom'),
	domModule      = require('../modules/dom'),
	filterModule   = require('../modules/filter');

function startEditingCell(config, cellElement, instances, onInputBlurEventHandler) {
	if (!config.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.getRowNumber(config, cellElement),
		columnNumber = domUtil.getColumnNumber(config, cellElement);

	if (rowNumber >= config.dataSource.length) {
		return;
	}

	var cellData = tableUtil.getCellData(config, rowNumber, columnNumber),
		inputElement = document.createElement('input');

	inputElement.setAttribute('type', 'text');

	var args = new EventArguments({
		cellElement: cellElement,
		cellData: cellData,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeEdit(args);

	if (!args.cancelEvent) {
		cellElement.classList.add(config.selectors.editingCell);
		cellElement.classList.remove(config.selectors.editedCell);
		cellElement.innerHTML = '';
		cellElement.appendChild(inputElement);

		instances.onInputBlurEventHandler = function(ev) { onInputBlurEventHandler(ev, config); };

		inputElement.focus();
		inputElement.value = cellData.getValue();
		inputElement.addEventListener('blur', instances.onInputBlurEventHandler);
	}
}

function finishEditingCell(config, inputElement, onInputBlurEventHandler) {
	var cellElement = inputElement.parentNode,
		rowNumber = domUtil.getRowNumber(config, cellElement),
		columnNumber = domUtil.getColumnNumber(config, cellElement),
		cellData = tableUtil.getCellData(config, rowNumber, columnNumber);

	cellData.updateAttributes({ class: config.selectors.editedCell });
	cellData.updateValue(inputElement.value);

	if (!cellData.isCellChanged()) {
		domModule.resetEditingCell(config, onInputBlurEventHandler);

		return;
	}

	var args = new EventArguments({
		cellElement: cellElement,
		cellData: cellData,
		cancelEvent: false
	});

	config.eventHandlers.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.storeUpdatedCellValue(config, args.cellData);
		domModule.updateCell(config, args.cellElement, args.cellData);

		config.eventHandlers.onAfterEdit(args);

		filterModule.filter(config);
	}
}

function saveCells(config) {
	if (!config.edit.enabled) {
		return;
	}

	var args = new EventArguments({
		updatedDataList: tableUtil.getUpdatedDataList(config),
		cancelEvent: false
	});

	config.eventHandlers.onBeforeSave(args);

	if (!args.cancelEvent) {
		tableUtil.persistCellValue(config);

		domModule.resetEditedCells(config);

		config.eventHandlers.onAfterSave(args);
	}
}

module.exports = {
	startEditingCell: startEditingCell,
	finishEditingCell: finishEditingCell,
	saveCells: saveCells
};