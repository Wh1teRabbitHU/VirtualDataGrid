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
	cell.className = configInstance.inner.selectors.dataCell + ' ' + (cellObj.class || '');
}

function updateTable() {
	var countRow = 0,
		colspan = 1;

	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' tr.' + configInstance.inner.selectors.headerRow).forEach(function(row) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.headerCell).forEach(function(cell, cellNumber) {
			var cellObj = configInstance.headers[countRow][configInstance.inner.leftCellOffset + cellNumber];

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
				var calculatedColspan = configInstance.inner.visibleColumnNumber <= cellNumber + cellObj.colspan ? configInstance.inner.visibleColumnNumber - cellNumber : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
			}
		});
		countRow++;
		colspan = 1;
	});

	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' tr.' + configInstance.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getCell(configInstance.inner.topCellOffset + rowNumber, configInstance.inner.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + configInstance.selectors.fixedTable + ' tr.' + configInstance.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getFixedCell(configInstance.inner.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(onInputBlurEventHandler) {
	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(configInstance.selectors.editingCell);
	});
}

function resetEditedCell() {
	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.selectors.editingCell).forEach(function(editedCell) {
		editedCell.classList.remove(configInstance.selectors.editedCell);
	});

	configInstance.inner.editedCells = [];
	updateTable();
}

function destroyTable() {
	document.querySelector(configInstance.selectors.mainContainer).innerHTML = '';
}

module.exports = {
	indexOfElement: indexOfElement,
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable
};