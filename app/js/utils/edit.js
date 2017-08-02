'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil = require('./table'),
	domUtil   = require('./dom');

var configInstance = require('../instances/configuration');

function saveCells() {
	if (!configInstance.editable) {
		return;
	}

	var args = new EventArguments({
		cellObject: configInstance.editedCells,
		cancelEvent: false
	});

	configInstance.onBeforeSave(args);

	if (!args.cancelEvent) {
		configInstance.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell();

		configInstance.onAfterSave(args);
	}
}

module.exports = {
	saveCells: saveCells
};