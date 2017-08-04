'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil = require('./table'),
	domUtil   = require('./dom');

function saveCells(config) {
	if (!config.edit.enabled) {
		return;
	}

	var args = new EventArguments({
		cellObject: config.inner.editedCells,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeSave(args);

	if (!args.cancelEvent) {
		config.inner.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(config, cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell(config);

		config.eventHandlers.onAfterSave(args);
	}
}

module.exports = {
	saveCells: saveCells
};