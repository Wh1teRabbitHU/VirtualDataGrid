'use strict';

var tableUtil = require('./table');

function indexOfElement(element) {
	var collection = element.parentNode.childNodes;

	for (var i = 0; i < collection.length; i++) {
		if (collection[i] === element) {
			return i;
		}
	}

	return -1;
}

function updateCell(config, cell, cellObj) {
	cell.innerHTML = cellObj.value;
	cell.className = config.inner.selectors.dataCell + ' ' + (cellObj.class || '');
}

function updateTable(config) {
	var countRow = 0, // TODO: kiszedni, mivel a foreach függvény második paramétere egy counter
		colspan = 1;

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.headers[countRow][config.inner.leftCellOffset + cellCount];

			if (colspan > 1) {
				cell.style.display = 'none';
				colspan--;
			} else {
				cell.innerHTML = getHeaderCellHtml(config, cell, cellObj);
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
		countRow++;
		colspan = 1;
	});

	if (config.filter.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
			var cellObj = config.headers[config.inner.indexOfCellKeyHeader][config.inner.leftCellOffset + cellCount],
				filterObj = config.inner.filters[cellObj.key] || {},
				currentFilterAttr = cell.getAttribute('data-attribute');

			if (cellObj.key === currentFilterAttr) {
				return;
			}

			cell.setAttribute('data-attribute', cellObj.key);
			cell.setAttribute('data-type', cellObj.type || 'text');
			cell.innerHTML = getFilterCellHtml(config, cell, filterObj);
		});
	}

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(config, cell, tableUtil.getCell(config, config.inner.topCellOffset + rowNumber, config.inner.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(config, cell, tableUtil.getFixedCell(config, config.inner.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(config, onInputBlurEventHandler) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(config.selectors.editingCell);
	});
}

function resetEditedCell(config) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editedCell) {
		editedCell.classList.remove(config.selectors.editedCell);
	});

	config.inner.editedCells = [];
	updateTable(config);
}

function destroyTable(config) {
	document.querySelector(config.selectors.mainContainer).innerHTML = '';
}

function getHeaderCellHtml(config, cell, cellObj) {
	var innerHTML = '',
		columnText = cellObj.text || cellObj.key || '';

	if (config.sort.enabled && !cellObj.sortDisabled) {
		var attribute = cellObj.key,
			direction = config.inner.sort.attribute === attribute ? config.inner.sort.direction : 'none',
			isSorted = direction !== 'none',
			iconClass = direction === 'down' ? config.inner.icons.sort.asc : config.inner.icons.sort.desc,
			iconElementClass = config.inner.selectors.sortIcon + (isSorted ? ' ' + iconClass : 'hidden');

		innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';

		cell.setAttribute('data-direction', direction);
		cell.setAttribute('data-attribute', attribute);
	}

	innerHTML += columnText;

	return innerHTML;
}

function getFilterCellHtml(config, cell, filterObj) {
	var innerHTML = '',
		iconClass = config.inner.icons.filter.search,
		iconElementClass = config.inner.selectors.filterSearchIcon + ' ' + iconClass,
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';
	innerHTML += filterObj.value || '';

	if (typeof filterObj.value != 'undefined' && filterObj.value !== '') {
		innerHTML += '<i class="' + clearIconElementClass + '" aria-hidden="true"></i>';
	}

	return innerHTML;
}

function findParentNode(child, selector) {
	if (child.parentNode === null) {
		return null;
	} else if (child.parentNode.matches(selector)) {
		return child.parentNode;
	}

	return findParentNode(child.parentNode, selector);
}

function getCellFullWidth(config) {
	return config.dimensions.cellPaddingHorizontal * 2 + config.dimensions.cellWidth + config.dimensions.cellBorderWidth;
}

module.exports = {
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable,

	indexOfElement: indexOfElement,
	getHeaderCellHtml: getHeaderCellHtml,
	getFilterCellHtml: getFilterCellHtml,
	findParentNode: findParentNode,
	getCellFullWidth: getCellFullWidth
};