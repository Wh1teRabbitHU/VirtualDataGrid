'use strict';

var tableUtil = require('./table');

var configInstance = require('../instances/configuration');

function indexOfElement(element) {
	var collection = element.parentNode.childNodes;

	for (var i = 0; i < collection.length; i++) {
		if (collection[i] === element) {
			return i;
		}
	}

	return -1;
}

function updateCell(cell, cellObj) {
	cell.innerHTML = cellObj.value;
	cell.className = configInstance.dataCellClass + ' ' + (cellObj.class || '');
}

function updateTable() {
	var countRow = 0,
		colspan = 1;

	document.querySelectorAll('.' + configInstance.virtualTableClass + ' tr.' + configInstance.headerRowClass).forEach(function(row) {
		row.querySelectorAll('td.' + configInstance.headerCellClass).forEach(function(cell, cellNumber) {
			var cellObj = configInstance.headers[countRow][configInstance.leftCellOffset + cellNumber];

			if (colspan > 1) {
				cell.style.display = 'none';
				colspan--;
			} else {
				cell.innerHTML = cellObj.text || cellObj.key || '';
				cell.style.display = 'table-cell';
			}

			if (typeof cellObj.colspan == 'undefined') {
				cell.removeAttribute('colspan');
			} else {
				var calculatedColspan = configInstance.visibleColumnNumber <= cellNumber + cellObj.colspan ? configInstance.visibleColumnNumber - cellNumber : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
			}
		});
		countRow++;
		colspan = 1;
	});

	document.querySelectorAll('.' + configInstance.virtualTableClass + ' tr.' + configInstance.dataRowClass).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.dataCellClass).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getCell(configInstance.topCellOffset + rowNumber, configInstance.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + configInstance.fixedTableClass + ' tr.' + configInstance.dataRowClass).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.dataCellClass).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getFixedCell(configInstance.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(onInputBlurEventHandler) {
	document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.editingCellClass).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(configInstance.editingCellClass);
	});
}

function resetEditedCell() {
	document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.editingCellClass).forEach(function(editedCell) {
		editedCell.classList.remove(configInstance.editedCellClass);
	});

	configInstance.editedCells = [];
	updateTable();
}

function destroyTable() {
	document.querySelector(configInstance.containerSelector).innerHTML = '';
}

module.exports = {
	indexOfElement: indexOfElement,
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable
};