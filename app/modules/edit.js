'use strict';

var BeforeEditArgs = require('../models/event-arguments/before-edit'),
	BeforeSaveArgs = require('../models/event-arguments/before-save'),
	ValidationArgs = require('../models/event-arguments/validation'),
	SaveRowArgs    = require('../models/event-arguments/save-row'),
	SaveBatchArgs  = require('../models/event-arguments/save-batch'),
	AfterEditArgs  = require('../models/event-arguments/after-edit'),
	AfterSaveArgs  = require('../models/event-arguments/after-save'),
	cellElement    = require('../elements/cell'),
	tableUtil      = require('../utils/table'),
	domUtil        = require('../utils/dom'),
	domModule      = require('../modules/dom'),
	filterModule   = require('../modules/filter');

function startEditingCell(config, cellNode, instances, eventHandlers) {
	if (!config.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.getRowNumber(config, cellNode),
		columnNumber = domUtil.getColumnNumber(config, cellNode);

	if (rowNumber >= config.dataSource.length) {
		return;
	}

	var cellData = tableUtil.getCellData(config, rowNumber, columnNumber),
		inputElement = document.createElement('input');

	var beforeEditArgs = new BeforeEditArgs({
		cellNode: cellNode,
		cellData: cellData,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeEdit(beforeEditArgs);

	if (!beforeEditArgs.cancelEvent) {
		cellNode.classList.add(config.selectors.editingCell);
		cellNode.classList.remove(config.selectors.editedCell);

		cellElement.updateDataContainer(config, cellNode, inputElement);

		instances.onInputBlurEventHandler = function(ev) { eventHandlers.onInputBlurEventHandler(ev, config); };
		instances.onInputKeyUpEventHandler = function(ev) { eventHandlers.onInputKeyUpEventHandler(ev, config); };

		inputElement.focus();
		inputElement.value = cellData.getValue();
		inputElement.style.minWidth = '10px'; // TODO: Kiszervezni osztályba
		inputElement.style.width = '80%'; // TODO: Kiszervezni osztályba
		inputElement.setAttribute('type', cellData.dataType);
		inputElement.addEventListener('blur', instances.onInputBlurEventHandler);
		inputElement.addEventListener('keyup', instances.onInputKeyUpEventHandler);
	}
}

function finishEditingCell(config, inputElement, eventHandlers) {
	var cellNode = inputElement.parentNode.parentNode,
		rowNumber = domUtil.getRowNumber(config, cellNode),
		columnNumber = domUtil.getColumnNumber(config, cellNode),
		cellData = tableUtil.getCellData(config, rowNumber, columnNumber),
		updatedValue = inputElement.value;

	cellData.updateAttributes({ class: config.selectors.editedCell });
	cellData.updateValue(updatedValue);

	if (!cellData.isCellChanged()) {
		domModule.resetEditingCell(config, eventHandlers);

		return;
	}

	var validationArgs = new ValidationArgs({
		cellNode: cellNode,
		cellData: cellData,
		cancelEvent: false
	});

	config.eventHandlers.onValidation(validationArgs);

	if (validationArgs.cancelEdit !== true) {
		tableUtil.storeUpdatedCellValue(config, cellData);
		cellElement.updateCell(config, cellNode, cellData);

		var afterEditArgs = new AfterEditArgs({
			cellNode: cellNode,
			cellData: cellData
		});

		config.eventHandlers.onAfterEdit(afterEditArgs);

		filterModule.filter(config);
	}
}

function cancelEditingCell(config) {
	return '';
}

function saveCells(config) {
	if (!config.edit.enabled) {
		return;
	}

	var beforeSaveArgs = new BeforeSaveArgs({
		editedRows: config.inner.editedValues,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeSave(beforeSaveArgs);

	if (beforeSaveArgs.cancelEvent) {
		return;
	}

	if (config.edit.mode === 'row') { // Row mode
		var saveRowArgs = new SaveRowArgs({ cancelEvent: false });

		config.dataSource.forEach(function(row) {
			saveRowArgs = new SaveRowArgs({
				editedRow: config.inner.editedValues,
				cancelEvent: false
			});

			if (!saveRowArgs.cancelEvent) {
				config.eventHandlers.onSavingRow(saveRowArgs);
			}

			if (!saveRowArgs.cancelEvent) {
				tableUtil.persistRowValues(config, row);
			}
		});

		if (!saveRowArgs.cancelEvent) {
			return;
		}
	} else if (config.edit.mode === 'batch') { // Batch mode
		var saveBatchArgs = new SaveBatchArgs({
			editedRows: config.inner.editedValues,
			cancelEvent: false
		});

		config.eventHandlers.onSavingBatch(saveBatchArgs);

		if (saveBatchArgs.cancelEvent) {
			return;
		}

		tableUtil.persistBatchValues(config);
	}

	var afterSaveArgs = new AfterSaveArgs({
		savedRows: config.inner.editedValues
	});

	domModule.resetEditedCells(config);

	config.eventHandlers.onAfterSave(afterSaveArgs);
}

module.exports = {
	startEditingCell: startEditingCell,
	finishEditingCell: finishEditingCell,
	cancelEditingCell: cancelEditingCell,
	saveCells: saveCells
};