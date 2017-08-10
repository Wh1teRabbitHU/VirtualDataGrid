'use strict';

var tableUtil = require('./table'),
	configUtil = require('./configuration');

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

function updateTable(config, forceUpdate) {
	var colspan = 1;

	if (config.inner.previousLeftCellOffset === config.inner.leftCellOffset &&
		config.inner.previousTopCellOffset === config.inner.topCellOffset &&
		forceUpdate === false) {

		return;
	}

	config.inner.previousLeftCellOffset = config.inner.leftCellOffset;
	config.inner.previousTopCellOffset = config.inner.topCellOffset;

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row, rowCount) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellCount) {
			var cellObj = config.headers[rowCount][config.inner.leftCellOffset + cellCount],
				isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

			if (colspan > 1) {
				cell.style.display = 'none';
				colspan--;
			} else {
				cell.innerHTML = getHeaderCellHtml(config, cell, cellObj, isLastRow);
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

		document.querySelectorAll('.' + config.selectors.fixedTable + ' td.' + config.inner.selectors.filterCell).forEach(function(cell, cellCount) {
			var cellObj = config.fixedHeaders[config.inner.indexOfCellKeyHeader][cellCount],
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
	document.querySelector('.' + config.selectors.virtualContainer).scrollTop = 0;

	config.inner.tableOffsetWidth = configUtil.getTableOffsetWidth(config);
	config.inner.tableOffsetHeight = configUtil.getTableOffsetHeight(config);
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

function getHeaderCellHtml(config, cell, cellObj, isLastRow) {
	var innerHTML = '',
		columnText = cellObj.text || cellObj.key || '';

	if (config.sort.enabled && !cellObj.sortDisabled && isLastRow) {
		var attribute = cellObj.key,
			direction = typeof attribute != 'undefined' && config.inner.sort.attribute === attribute ? config.inner.sort.direction : 'none',
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

module.exports = {
	updateCell: updateCell,
	updateTable: updateTable,
	updateBuffers: updateBuffers,
	recalculateDimensions: recalculateDimensions,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable,

	// TODO: Ezek mehetnek utilba, a többi meg modulesként
	indexOfElement: indexOfElement,
	getHeaderCellHtml: getHeaderCellHtml,
	getFilterCellHtml: getFilterCellHtml,
	findParentNode: findParentNode
};