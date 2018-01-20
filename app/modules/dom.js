'use strict';

var tableUtil   = require('../utils/table'),
	configUtil  = require('../utils/configuration'),
	cellElement = require('../elements/cell');

function updateTable(config, forceUpdate) {
	var colspan = 1;

	if (config.inner.previousLeftCellOffset === config.inner.leftCellOffset &&
		config.inner.previousTopCellOffset === config.inner.topCellOffset &&
		forceUpdate === false) {

		return;
	}

	config.inner.previousLeftCellOffset = config.inner.leftCellOffset;
	config.inner.previousTopCellOffset = config.inner.topCellOffset;

	// Header cell update
	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.headers[rowCount][config.inner.leftCellOffset + cellCount],
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
				var calculatedColspan = config.inner.visibleColumnNumber <= cellCount + cellObj.colspan ? config.inner.visibleColumnNumber - cellCount : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
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
			var cellObj = configUtil.getKeyHeader(config)[config.inner.leftCellOffset + cellCount],
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

	// Cell data row update
	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var cellData = tableUtil.getCellData(config, config.inner.topCellOffset + rowNumber, config.inner.leftCellOffset + cellNumber);

			cellElement.updateCell(config, cell, cellData);
		});
	});

	// Fixed cell data row update
	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			var fixedCellData = tableUtil.getFixedCellData(config, config.inner.topCellOffset + rowNumber, cellNumber);

			cellElement.updateCell(config, cell, fixedCellData);
		});
	});
}

function updateBuffers(config) {
	var virtualContainer = document.querySelector('.' + config.selectors.virtualContainer),
		cellFullWidth = configUtil.getCellFullWidth(config),
		left = virtualContainer.scrollLeft - virtualContainer.scrollLeft % cellFullWidth - config.inner.colspanOffset * cellFullWidth,
		right = config.inner.tableOffsetWidth - left,
		top = virtualContainer.scrollTop,
		bottom = config.inner.tableOffsetHeight - top;

	left = left > config.inner.tableOffsetWidth ? config.inner.tableOffsetWidth : left;
	left = left < config.inner.minBufferWidth ? config.inner.minBufferWidth : left;
	right = config.inner.tableOffsetWidth - left;
	top = top + config.inner.minBufferHeight > config.inner.tableOffsetHeight ? config.inner.tableOffsetHeight - config.inner.minBufferHeight : top + config.inner.minBufferHeight;
	bottom = config.inner.tableOffsetHeight > top ? config.inner.tableOffsetHeight - top : config.inner.minBufferHeight;

	config.inner.leftCellOffset = Math.floor(left / cellFullWidth);
	config.inner.topCellOffset = Math.floor((top - top % config.dimensions.cellHeight) / config.dimensions.cellHeight);

	config.inner.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	config.inner.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	config.inner.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	config.inner.bufferBottom.forEach(function(el) {
		el.style.height = bottom + 'px';
	});
}

function recalculateDimensions(config) {
	var smallerTable = config.dataSource.length < config.inner.visibleRowNumber,
		virtualContainer = document.querySelector('.' + config.selectors.virtualContainer);

	virtualContainer.classList.toggle('no-vertical-scroll', smallerTable);

	if (smallerTable) {
		virtualContainer.scrollTop = 0;
	}

	config.inner.tableOffsetWidth = configUtil.getTableOffsetWidth(config);
	config.inner.tableOffsetHeight = configUtil.getTableOffsetHeight(config);
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

	updateTable(config);
}

function destroyTable(config) {
	document.querySelector(config.selectors.mainContainer).innerHTML = '';
}

module.exports = {
	updateTable: updateTable,
	updateBuffers: updateBuffers,
	recalculateDimensions: recalculateDimensions,
	resetEditingCell: resetEditingCell,
	resetEditedCells: resetEditedCells,
	destroyTable: destroyTable
};