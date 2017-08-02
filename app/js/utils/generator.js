'use strict';

function initContainers(instance) {
	var container = document.querySelector(instance.containerSelector),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(instance.virtualContainerClass);
	virtualTable.classList.add(instance.virtualTableClass);
	fixedContainer.classList.add(instance.fixedContainerClass);
	fixedTable.classList.add(instance.fixedTableClass);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = instance.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = instance.minCellHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(instance) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr');

	trHeadBuffer.classList.add(instance.bufferRowTopClass);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(instance.bufferColumnLeftClass);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < instance.visibleColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = instance.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(instance.bufferColumnRightClass);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	instance.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.headerRowClass);
		trHead.style.height = instance.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnLeftClass);

		trHead.appendChild(tdElement);

		for (j = 0; j < instance.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.headerCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';
			tdElement.innerHTML = headerRow[j].text || headerRow[j].key || '';

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnRightClass);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual body
	for (i = 0; i < instance.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.dataRowClass);
		trBody.style.height = instance.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnLeftClass);

		trBody.appendChild(tdElement);

		for (j = 0; j < instance.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.dataCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnRightClass);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(instance.bufferRowBottomClass);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + instance.virtualTableClass).appendChild(virtualThead);
	document.querySelector('.' + instance.virtualTableClass).appendChild(virtualTbody);

	instance.bufferLeft = document.querySelectorAll('.' + instance.bufferColumnLeftClass);
	instance.bufferRight = document.querySelectorAll('.' + instance.bufferColumnRightClass);
	instance.bufferTop = document.querySelectorAll('.' + instance.bufferRowTopClass);
	instance.bufferBottom = document.querySelectorAll('.' + instance.bufferRowBottomClass);

	// Generate fixed table

	if (instance.fixedHeaders.length === 0) {
		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < instance.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.headerRowClass);
		trHead.style.height = instance.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.headerCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';
			tdElement.innerHTML = instance.fixedHeaders[i][j].text || instance.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < instance.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.dataRowClass);
		trBody.style.height = instance.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[instance.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.dataCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + instance.fixedTableClass).appendChild(fixedThead);
	document.querySelector('.' + instance.fixedTableClass).appendChild(fixedTbody);
}

function initBuffers(instance) {
	var left = document.querySelector('.' + instance.virtualContainerClass).scrollLeft - document.querySelector('.' + instance.virtualContainerClass).scrollLeft % instance.cellWidth - instance.colspanOffset * instance.cellWidth,
		right = instance.tableWidth - left,
		top = document.querySelector('.' + instance.virtualContainerClass).scrollTop,
		bottom = instance.tableHeight - top;

	left = left > instance.tableWidth ? instance.tableWidth : left;
	left = left < 0 ? 0 : left;
	right = instance.tableWidth - left;
	top = top + instance.minCellHeight > instance.tableHeight ? instance.tableHeight + instance.minCellHeight : top + instance.minCellHeight;
	bottom = instance.tableHeight - top;

	instance.leftCellOffset = Math.floor(left / instance.cellWidth);
	instance.topCellOffset = Math.floor((top - top % instance.cellHeight) / instance.cellHeight);

	instance.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	instance.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	instance.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	instance.bufferBottom.forEach(function(el) {
		el.style.height = bottom + 'px';
	});
}

module.exports = {
	initTable: initTable,
	initContainers: initContainers,
	initBuffers: initBuffers
};