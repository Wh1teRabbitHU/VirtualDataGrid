'use strict';

function initContainers(instance) {
	var container = document.querySelector(instance.selectors.mainContainer),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(instance.selectors.virtualContainer);
	virtualTable.classList.add(instance.selectors.virtualTable);
	fixedContainer.classList.add(instance.selectors.fixedContainer);
	fixedTable.classList.add(instance.selectors.fixedTable);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = instance.dimensions.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = instance.inner.minCellHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(instance) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr');

	trHeadBuffer.classList.add(instance.inner.selectors.bufferRowTopClass);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(instance.inner.selectors.bufferColumnLeft);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < instance.inner.visibleColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(instance.inner.selectors.bufferColumnRight);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	instance.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.inner.selectors.headerRow);
		trHead.style.height = instance.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < instance.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.headerCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
			tdElement.innerHTML = headerRow[j].text || headerRow[j].key || '';

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnRight);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual body
	for (i = 0; i < instance.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.inner.selectors.dataRow);
		trBody.style.height = instance.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnLeft);

		trBody.appendChild(tdElement);

		for (j = 0; j < instance.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.dataCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnRight);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(instance.inner.selectors.bufferRowBottom);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + instance.selectors.virtualTable).appendChild(virtualThead);
	document.querySelector('.' + instance.selectors.virtualTable).appendChild(virtualTbody);

	instance.inner.bufferLeft = document.querySelectorAll('.' + instance.inner.selectors.bufferColumnLeft);
	instance.inner.bufferRight = document.querySelectorAll('.' + instance.inner.selectors.bufferColumnRight);
	instance.inner.bufferTop = document.querySelectorAll('.' + instance.inner.selectors.bufferRowTopClass);
	instance.inner.bufferBottom = document.querySelectorAll('.' + instance.inner.selectors.bufferRowBottom);

	// Generate fixed table

	if (instance.fixedHeaders.length === 0) {
		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < instance.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.inner.selectors.headerRow);
		trHead.style.height = instance.dimensions.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.headerCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
			tdElement.innerHTML = instance.fixedHeaders[i][j].text || instance.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < instance.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.inner.selectors.dataRow);
		trBody.style.height = instance.dimensions.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[instance.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.dataCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + instance.selectors.fixedTable).appendChild(fixedThead);
	document.querySelector('.' + instance.selectors.fixedTable).appendChild(fixedTbody);
}

function initBuffers(instance) {
	var left = document.querySelector('.' + instance.selectors.virtualContainer).scrollLeft - document.querySelector('.' + instance.selectors.virtualContainer).scrollLeft % instance.dimensions.cellWidth - instance.inner.colspanOffset * instance.dimensions.cellWidth,
		right = instance.tableWidth - left,
		top = document.querySelector('.' + instance.selectors.virtualContainer).scrollTop,
		bottom = instance.tableHeight - top;

	left = left > instance.tableWidth ? instance.tableWidth : left;
	left = left < 0 ? 0 : left;
	right = instance.tableWidth - left;
	top = top + instance.inner.minCellHeight > instance.tableHeight ? instance.tableHeight + instance.inner.minCellHeight : top + instance.inner.minCellHeight;
	bottom = instance.tableHeight - top;

	instance.inner.leftCellOffset = Math.floor(left / instance.dimensions.cellWidth);
	instance.inner.topCellOffset = Math.floor((top - top % instance.dimensions.cellHeight) / instance.dimensions.cellHeight);

	instance.inner.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	instance.inner.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	instance.inner.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	instance.inner.bufferBottom.forEach(function(el) {
		el.style.height = bottom + 'px';
	});
}

module.exports = {
	initTable: initTable,
	initContainers: initContainers,
	initBuffers: initBuffers
};