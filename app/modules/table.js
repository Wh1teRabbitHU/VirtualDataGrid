'use strict';

var tableUtil   = require('../utils/table'),
	configUtil  = require('../utils/configuration'),
	cellElement = require('../elements/cell');

function initTable(config, elementHolder) {
	updateHeader(config, elementHolder);
	updateData(config, elementHolder);
}

function updateTable(config) {
	var elementHolder = {
		mainContainer: document.querySelector(config.selectors.mainContainer),
		headerContainer: document.querySelector('.' + config.selectors.dataHeaderContainer),
		dataContainer: document.querySelector('.' + config.selectors.dataContainer),
		fixedContainer: document.querySelector('.' + config.selectors.fixedContainer),
		dataHeaderContainer: document.querySelector('.' + config.selectors.dataHeaderContainer),

		dataHeaderTable: document.querySelector('.' + config.selectors.dataHeaderTable),
		fixedHeaderTable: document.querySelector('.' + config.selectors.fixedHeaderTable),
		dataTable: document.querySelector('.' + config.selectors.dataTable),
		fixedTable: document.querySelector('.' + config.selectors.fixedTable)
	};

	updateHeader(config, elementHolder);
	updateData(config, elementHolder);
}

function updateHeader(config, elementHolder) {
	var colspan = 1,
		dataHeaderRowList = elementHolder.dataHeaderTable.querySelectorAll('tr.' + config.inner.selectors.headerRow),
		fixedHeaderRowList = elementHolder.fixedHeaderTable.querySelectorAll('tr.' + config.inner.selectors.headerRow);

	// Header cell update
	dataHeaderRowList.forEach(function(row, rowCount) {
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
	fixedHeaderRowList.forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.fixedHeaders[rowCount][cellCount],
				isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

			cellElement.updateDataContainer(config, cell, cellElement.createHeaderData(config, cell, cellObj, isLastRow));
		});

		updateFixedHeight(config, dataHeaderRowList, row, rowCount);
	});

	// Filter row update
	if (config.filter.enabled) {
		elementHolder.dataHeaderTable.querySelectorAll('td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
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

		elementHolder.dataHeaderTable.querySelectorAll('td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
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

function updateData(config, elementHolder) {
	var dataRowList = elementHolder.dataTable.querySelectorAll('tr.' + config.inner.selectors.dataRow),
		fixedRowList = elementHolder.fixedTable.querySelectorAll('tr.' + config.inner.selectors.dataRow);

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

	var originalHeight = config.dimensions.cellHeight + 'px';

	if (dataRow.style.height !== originalHeight) {
		dataRow.style.height = originalHeight;
	}

	if (fixedRow.style.height !== originalHeight) {
		fixedRow.style.height = originalHeight;
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

function updateContainerHeight(config) {
	var mainContainer = document.querySelector(config.selectors.mainContainer),
		headerContainer = document.querySelector('.' + config.selectors.dataHeaderContainer),
		dataContainer = document.querySelector('.' + config.selectors.dataContainer),
		fixedContainer = document.querySelector('.' + config.selectors.fixedContainer),
		windowHeight = window.innerHeight,
		containerTopPosition = mainContainer.getBoundingClientRect().top,
		headerRowsHeight = headerContainer.getBoundingClientRect().height,
		containerPaddingBottom = config.dimensions.containerPaddingBottom,
		containerHeight = windowHeight - containerTopPosition - headerRowsHeight - containerPaddingBottom;

	if (config.dimensions.containerHeight === containerHeight) {
		return;
	}

	config.dimensions.containerHeight = containerHeight;

	dataContainer.style.maxHeight = containerHeight + 'px';
	dataContainer.style.height = containerHeight + 'px';

	if (fixedContainer !== null) {
		fixedContainer.style.maxHeight = containerHeight + 'px';
		fixedContainer.style.height = containerHeight + 'px';
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
	initTable: initTable,
	updateTable: updateTable,
	updateHeader: updateHeader,
	updateData: updateData,
	updateContainerHeight: updateContainerHeight,
	scrollTables: scrollTables,
	resetEditingCell: resetEditingCell,
	resetEditedCells: resetEditedCells,
	destroyTable: destroyTable
};