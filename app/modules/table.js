'use strict';

var tableUtil   = require('../utils/table'),
	configUtil  = require('../utils/configuration'),
	cellElement = require('../elements/cell');

function updateTable(config) {
	updateHeader(config);
	updateData(config);
}

function updateHeader(config) {
	var colspan = 1;

	// Header cell update
	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.headers[rowCount][cellCount],
				isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

			if (colspan > 1) {
				cell.style.display = 'none';
				colspan--;
			} else {
				cellElement.updateDataContainer(config, cell, cellElement.createHeaderData(config, cell, cellObj, isLastRow));

				cell.style.display = 'table-cell';
			}

			if (typeof cellObj.colspan == 'undefined') {
				cell.removeAttribute('colspan');
			} else {
				cell.setAttribute('colspan', cellObj.colspan);

				colspan = cellObj.colspan;
			}
		});

		colspan = 1;
	});

	// Fixed header cell update
	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.fixedHeaders[rowCount][cellCount],
				isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

			cellElement.updateDataContainer(config, cell, cellElement.createHeaderData(config, cell, cellObj, isLastRow));
		});
	});

	// Filter row update
	if (config.filter.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
			var cellObj = configUtil.getKeyHeader(config)[cellCount],
				filterObj = config.inner.filters[cellObj.key] || {},
				currentFilterAttr = cell.getAttribute('data-attribute');

			if (cellObj.key === currentFilterAttr) {
				return;
			}

			cell.setAttribute('data-attribute', cellObj.key);
			cell.classList.toggle(config.inner.selectors.filterDisabled, cellObj.filterDisabled);

			cellElement.updateDataContainer(config, cell, cellElement.createFilterData(config, cell, cellObj, filterObj));
		});

		document.querySelectorAll('.' + config.selectors.fixedTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
			var cellObj = config.fixedHeaders[config.inner.indexOfCellKeyHeader][cellCount],
				filterObj = config.inner.filters[cellObj.key] || {},
				currentFilterAttr = cell.getAttribute('data-attribute');

			if (cellObj.key === currentFilterAttr) {
				return;
			}

			cell.setAttribute('data-attribute', cellObj.key);
			cell.classList.toggle(config.inner.selectors.filterDisabled, cellObj.filterDisabled);

			cellElement.updateDataContainer(config, cell, cellElement.createFilterData(config, cell, cellObj, filterObj));
		});
	}
}

function updateData(config) {

	// Cell data row update
	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var cellData = tableUtil.getCellData(config, rowNumber, cellNumber);

			cellElement.updateCell(config, cell, cellData);
		});
	});

	// Fixed cell data row update
	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var fixedCellData = tableUtil.getFixedCellData(config, rowNumber, cellNumber);

			cellElement.updateCell(config, cell, fixedCellData);
		});
	});
}

function scrollTables(config) {
	var virtualContainer = document.querySelector('.' + config.selectors.virtualContainer),
		fixedContainer = document.querySelector('.' + config.selectors.fixedContainer);

	if (virtualContainer === null) {
		return;
	}

	if (fixedContainer !== null) {
		fixedContainer.scrollTop = virtualContainer.scrollTop;
	}
}

function resetEditingCell(config, eventHandlers) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', eventHandlers.onInputBlurEventHandler);
		input.removeEventListener('keyup', eventHandlers.onInputKeyUpEventHandler);

		cellElement.updateDataContainer(config, editingCell, input.value);

		editingCell.classList.remove(config.selectors.editingCell);
	});
}

function resetEditedCells(config) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editedCell) {
		editedCell.classList.remove(config.selectors.editedCell);
	});
}

function destroyTable(config) {
	document.querySelector(config.selectors.mainContainer).innerHTML = '';
}

module.exports = {
	updateTable: updateTable,
	updateHeader: updateHeader,
	updateData: updateData,
	scrollTables: scrollTables,
	resetEditingCell: resetEditingCell,
	resetEditedCells: resetEditedCells,
	destroyTable: destroyTable
};