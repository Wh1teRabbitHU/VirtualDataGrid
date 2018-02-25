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
	document.querySelectorAll('.' + config.selectors.dataHeaderTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
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
	document.querySelectorAll('.' + config.selectors.fixedHeaderTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.fixedHeaders[rowCount][cellCount],
				isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

			cellElement.updateDataContainer(config, cell, cellElement.createHeaderData(config, cell, cellObj, isLastRow));
		});
	});

	// Filter row update
	if (config.filter.enabled) {
		document.querySelectorAll('.' + config.selectors.dataHeaderTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
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

		document.querySelectorAll('.' + config.selectors.fixedHeaderTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
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
	var dataRowList = document.querySelectorAll('.' + config.selectors.dataTable + ' tr.' + config.inner.selectors.dataRow),
		fixedRowList = document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow);

	// Cell data row update
	dataRowList.forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var cellData = tableUtil.getCellData(config, rowNumber, cellNumber);

			cellElement.updateCell(config, cell, cellData);
		});
	});

	// Fixed cell data row update
	fixedRowList.forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var fixedCellData = tableUtil.getFixedCellData(config, rowNumber, cellNumber);

			cellElement.updateCell(config, cell, fixedCellData);
		});

		updateFixedHeight(config, dataRowList, row, rowNumber);
	});
}

function updateFixedHeight(config, dataRowList, fixedRow, rowNumber) {
	if (config.fixedHeaders.length === 0 || config.dimensions.lockCellHeight) {
		return;
	}

	var dataRow = dataRowList.length < rowNumber ? null : dataRowList[rowNumber];

	if (dataRow === null) {
		return; // It shouldn't be
	}

	var dataHeight = dataRow.clientHeight,
		fixedHeight = fixedRow.clientHeight;

	if (dataHeight === fixedHeight) {
		return; // No need for adjustment
	}

	if (dataHeight > fixedHeight) {
		fixedRow.style.height = dataHeight + 'px';
	} else {
		dataRow.style.height = fixedHeight + 'px';
	}
}

function scrollTables(config) {
	var dataContainer = document.querySelector('.' + config.selectors.dataContainer),
		fixedContainer = document.querySelector('.' + config.selectors.fixedContainer),
		dataHeaderContainer = document.querySelector('.' + config.selectors.dataHeaderContainer);

	if (dataContainer === null) {
		return;
	}

	if (fixedContainer !== null) {
		fixedContainer.scrollTop = dataContainer.scrollTop;
	}

	if (dataHeaderContainer !== null) {
		dataHeaderContainer.scrollLeft = dataContainer.scrollLeft;
	}
}

function resetEditingCell(config, eventHandlers) {
	document.querySelectorAll('.' + config.selectors.dataTable + ' td.' + config.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', eventHandlers.onInputBlurEventHandler);
		input.removeEventListener('keyup', eventHandlers.onInputKeyUpEventHandler);

		cellElement.updateDataContainer(config, editingCell, input.value);

		editingCell.classList.remove(config.selectors.editingCell);
	});
}

function resetEditedCells(config) {
	document.querySelectorAll('.' + config.selectors.dataTable + ' td.' + config.selectors.editingCell).forEach(function(editedCell) {
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