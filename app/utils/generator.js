'use strict';

var domUtil = require('./dom');

function initContainers(config) {
	var container = document.querySelector(config.selectors.mainContainer),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(config.selectors.virtualContainer);
	virtualTable.classList.add(config.selectors.virtualTable);
	fixedContainer.classList.add(config.selectors.fixedContainer);
	fixedTable.classList.add(config.selectors.fixedTable);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = config.inner.minBufferHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(config) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr'),
		columnsNumber = config.headers[config.inner.indexOfCellKeyHeader].length,
		rowsNumber = config.dataSource.length,
		maxColumnNumber = config.inner.visibleColumnNumber >= columnsNumber ? columnsNumber - 1 : config.inner.visibleColumnNumber,
		maxRowNumber = config.inner.visibleRowNumber >= rowsNumber ? rowsNumber - 1 : config.inner.visibleRowNumber;

	trHeadBuffer.classList.add(config.inner.selectors.bufferRowTop);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(config.inner.selectors.bufferColumnLeft);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < maxColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(config.inner.selectors.bufferColumnRight);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	config.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < maxColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';
			tdElement.innerHTML = domUtil.getHeaderCellHtml(config, tdElement, headerRow[j]);

			if (config.sort.enabled && !headerRow[j].sortDisabled) {
				tdElement.classList.add(config.inner.selectors.sortCell);
			}

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnRight);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual filter row
	if (config.filter.enabled) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.filterRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < maxColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';
			tdElement.innerHTML = domUtil.getFilterCellHtml(config, tdElement, {});

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnRight);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	}

	// Generate virtual body
	for (i = 0; i < maxRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trBody.appendChild(tdElement);

		for (j = 0; j < maxColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnRight);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(config.inner.selectors.bufferRowBottom);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + config.selectors.virtualTable).appendChild(virtualThead);
	document.querySelector('.' + config.selectors.virtualTable).appendChild(virtualTbody);

	config.inner.bufferLeft = document.querySelectorAll('.' + config.inner.selectors.bufferColumnLeft);
	config.inner.bufferRight = document.querySelectorAll('.' + config.inner.selectors.bufferColumnRight);
	config.inner.bufferTop = document.querySelectorAll('.' + config.inner.selectors.bufferRowTop);
	config.inner.bufferBottom = document.querySelectorAll('.' + config.inner.selectors.bufferRowBottom);

	// Generate fixed table

	if (config.fixedHeaders.length === 0 || config.fixedHeaders[0].length === 0) {
		document.querySelector('.' + config.selectors.fixedTable).remove();

		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < config.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.innerHTML = config.fixedHeaders[i][j].text || config.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed filter row

	if (config.filter.enabled &&
		config.fixedHeaders.length > 0 &&
		config.fixedHeaders[config.inner.indexOfCellKeyHeader].length > 0) {

		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.filterRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[config.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';
			tdElement.innerHTML = domUtil.getFilterCellHtml(config, tdElement, {});

			trHead.appendChild(tdElement);
		}

		virtualThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < maxRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[config.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);
			tdElement.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedThead);
	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedTbody);
}

function initBuffers(config) {
	var virtualContainer = document.querySelector('.' + config.selectors.virtualContainer),
		cellFullWidth = domUtil.getCellFullWidth(config),
		left = virtualContainer.scrollLeft - virtualContainer.scrollLeft % cellFullWidth - config.inner.colspanOffset * cellFullWidth,
		right = config.inner.tableOffsetWidth - left,
		top = virtualContainer.scrollTop,
		bottom = config.inner.tableOffsetHeight - top;

	left = left > config.inner.tableOffsetWidth ? config.inner.tableOffsetWidth : left;
	left = left < config.inner.minBufferWidth ? config.inner.minBufferWidth : left;
	right = config.inner.tableOffsetWidth - left;
	top = top + config.inner.minBufferHeight > config.inner.tableOffsetHeight ? config.inner.tableOffsetHeight + config.inner.minBufferHeight : top + config.inner.minBufferHeight;
	bottom = config.inner.tableOffsetHeight - top;

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

module.exports = {
	initTable: initTable,
	initContainers: initContainers,
	initBuffers: initBuffers
};