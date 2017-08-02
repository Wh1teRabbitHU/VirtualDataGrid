'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil = require('./table'),
	domUtil   = require('./dom');

var configInstance = require('../instances/configuration');

function saveCells() {
	if (!configInstance.edit.enabled) {
		return;
	}

	var args = new EventArguments({
		cellObject: configInstance.inner.editedCells,
		cancelEvent: false
	});

	configInstance.eventHandlers.onBeforeSave(args);

	if (!args.cancelEvent) {
		configInstance.inner.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell();

		configInstance.eventHandlers.onAfterSave(args);
	}
}

module.exports = {
	saveCells: saveCells
};