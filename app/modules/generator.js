'use strict';

var globalConfig = require('../configs/global'),
	events       = require('../modules/events'),
	tableModule  = require('../modules/table'),
	configUtil   = require('../utils/configuration'),
	dataUtil     = require('../utils/data'),
	cellElement  = require('../elements/cell');

function generateTable(config, options) {
	globalConfig.init(config, options);

	initContainers(config);

	globalConfig.initCalculatedValues(config);

	initTable(config);

	tableModule.updateBuffers(config);
	tableModule.updateTable(config);

	events.init(config);
}

function destroyTable(config) {
	events.remove(config);
	tableModule.destroyTable(config);
}

function initContainers(config) {
	var container = document.querySelector(config.selectors.mainContainer),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	container.setAttribute('id', config.inner.selectors.uniqueId);
	virtualContainer.classList.add(config.selectors.virtualContainer);
	virtualTable.classList.add(config.selectors.virtualTable);
	fixedContainer.classList.add(config.selectors.fixedContainer);
	fixedTable.classList.add(config.selectors.fixedTable);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	virtualContainer.style.height = config.dimensions.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = config.inner.minBufferHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(config) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr'),
		columnsNumber = configUtil.getKeyHeader(config).length,
		rowsNumber = config.dataSource.length,
		maxColumnNumber = config.inner.visibleColumnNumber >= columnsNumber ? columnsNumber : config.inner.visibleColumnNumber,
		maxRowNumber = config.inner.visibleRowNumber >= rowsNumber ? rowsNumber : config.inner.visibleRowNumber;

	trHeadBuffer.classList.add(config.inner.selectors.bufferRowTop);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement, cellObj;

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

	config.headers.forEach(function(headerRow, rowCount) {
		var isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < maxColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);

			cellElement.createDataContainer(config, tdElement, cellElement.createHeaderData(config, tdElement, headerRow[j], isLastRow));

			if (isLastRow) {
				tdElement.classList.add(config.inner.selectors.sortCell);

				if (!config.sort.enabled || headerRow[j].sortDisabled) {
					tdElement.classList.add(config.inner.selectors.sortDisabled);
				}
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
			cellObj = configUtil.getKeyHeader(config)[j];

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);

			cellElement.createDataContainer(config, tdElement, cellElement.createFilterData(config, tdElement, cellObj, {}));

			if (cellObj.filterDisabled) {
				tdElement.classList.add(config.inner.selectors.filterDisabled);
			}

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

			cellElement.createDataContainer(config, tdElement);

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
			var isLastRow = j === config.fixedHeaders[i].length - 1;

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);

			cellElement.createDataContainer(config, tdElement, cellElement.createHeaderData(config, tdElement, config.fixedHeaders[i][j], isLastRow));

			if (isLastRow) {
				tdElement.classList.add(config.inner.selectors.sortCell);

				if (!config.sort.enabled || config.fixedHeaders[i][j].sortDisabled) {
					tdElement.classList.add(config.inner.selectors.sortDisabled);
				}
			}

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
			cellObj = configUtil.getFixedKeyHeader(config)[j];

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';

			cellElement.createDataContainer(config, tdElement, cellElement.createFilterData(config, tdElement, cellObj, {}));

			if (cellObj.filterDisabled) {
				tdElement.classList.add(config.inner.selectors.filterDisabled);
			}

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < maxRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[config.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);

			cellElement.createDataContainer(config, tdElement);

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedThead);
	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedTbody);
}

function getDefaultOptions() {
	return dataUtil.cloneObject(globalConfig.DEFAULTS);
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable,
	getDefaultOptions: getDefaultOptions
};