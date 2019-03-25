'use strict';

var globalConfig = require('../configs/global'),
	events       = require('../modules/events'),
	tableModule  = require('../modules/table'),
	configUtil   = require('../utils/configuration'),
	dataUtil     = require('../utils/data'),
	cellElement  = require('../elements/cell');

function generateTable(config, options) {
	globalConfig.init(config, options);

	var elementHolder = {};

	initContainers(config, elementHolder);
	initTable(config, elementHolder);

	tableModule.initTable(config, elementHolder);

	appendTableToDOM(config, elementHolder);

	tableModule.updateContainerHeight(config);

	events.init(config);
}

function destroyTable(config) {
	events.remove(config);

	tableModule.destroyTable(config);
}

function initContainers(config, elementHolder) {
	var dataContainer = document.createElement('div'),
		dataHeaderContainer = document.createElement('div'),
		dataTable = document.createElement('table'),
		dataHeaderTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedHeaderContainer = document.createElement('div'),
		fixedTable = document.createElement('table'),
		fixedHeaderTable = document.createElement('table');

	dataContainer.classList.add(config.selectors.dataContainer);
	dataHeaderContainer.classList.add(config.selectors.dataHeaderContainer);
	dataTable.classList.add(config.selectors.dataTable);
	dataHeaderTable.classList.add(config.selectors.dataHeaderTable);
	fixedContainer.classList.add(config.selectors.fixedContainer);
	fixedHeaderContainer.classList.add(config.selectors.fixedHeaderContainer);
	fixedTable.classList.add(config.selectors.fixedTable);
	fixedHeaderTable.classList.add(config.selectors.fixedHeaderTable);

	fixedHeaderContainer.appendChild(fixedHeaderTable);
	dataHeaderContainer.appendChild(dataHeaderTable);
	dataContainer.appendChild(dataTable);
	fixedContainer.appendChild(fixedTable);

	dataContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	dataContainer.style.height = config.dimensions.containerHeight + 'px';

	fixedContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	fixedContainer.style.height = config.dimensions.containerHeight + 'px';

	elementHolder.fixedHeaderContainer = fixedHeaderContainer;
	elementHolder.dataHeaderContainer = dataHeaderContainer;
	elementHolder.dataContainer = dataContainer;
	elementHolder.fixedContainer = fixedContainer;
	elementHolder.dataHeaderTable = dataHeaderTable;
	elementHolder.dataTable = dataTable;
	elementHolder.fixedHeaderTable = fixedHeaderTable;
	elementHolder.fixedHeaderContainer = fixedHeaderContainer;
	elementHolder.fixedTable = fixedTable;
	elementHolder.fixedContainer = fixedContainer;
}

function initTable(config, elementHolder) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		columnsNumber = configUtil.getKeyHeader(config).length,
		rowsNumber = config.dataSource.length;

	var i, j, trHead, trBody, tdElement, cellObj, cellData;

	// Generate virtual header
	config.headers.forEach(function(headerRow, rowCount) {
		var isLastRow = config.inner.indexOfCellKeyHeader === rowCount;

		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < columnsNumber; j++) {
			cellObj = headerRow[j];
			cellData = cellElement.createHeaderData(config, tdElement, cellObj, isLastRow);

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);

			cellElement.createDataContainer(config, tdElement, cellObj, cellData);

			if (isLastRow) {
				tdElement.classList.add(config.inner.selectors.sortCell);

				if (!config.sort.enabled || headerRow[j].sortDisabled) {
					tdElement.classList.add(config.inner.selectors.sortDisabled);
				}
			}

			trHead.appendChild(tdElement);
		}

		// A scrollbr miatti helyhiány miatt van szükség beszúrni a végére
		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferHeaderCell);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual filter row
	if (config.filter.enabled) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.filterRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < columnsNumber; j++) {
			cellObj = configUtil.getKeyHeader(config)[j];
			cellData = cellElement.createHeaderData(config, tdElement, cellObj, {});

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);

			cellElement.createDataContainer(config, tdElement, cellObj, cellData);

			if (cellObj.filterDisabled) {
				tdElement.classList.add(config.inner.selectors.filterDisabled);
			}

			trHead.appendChild(tdElement);
		}

		// A scrollbr miatti helyhiány miatt van szükség beszúrni a végére
		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferHeaderCell);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	}

	// Generate virtual body
	for (i = 0; i < rowsNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < columnsNumber; j++) {
			cellObj = configUtil.getKeyHeader(config)[j];

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);

			cellElement.createDataContainer(config, tdElement, cellObj);

			trBody.appendChild(tdElement);
		}

		virtualTbody.appendChild(trBody);
	}

	elementHolder.dataHeaderTable.appendChild(virtualThead);
	elementHolder.dataTable.appendChild(virtualTbody);

	// Generate fixed table

	if (config.fixedHeaders.length === 0 || config.fixedHeaders[0].length === 0) {
		elementHolder.fixedHeaderTable.remove();
		elementHolder.fixedHeaderContainer.remove();
		elementHolder.fixedTable.remove();
		elementHolder.fixedContainer.remove();

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

			cellObj = config.fixedHeaders[i][j];
			cellData = cellElement.createHeaderData(config, tdElement, cellObj, isLastRow);

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);

			cellElement.createDataContainer(config, tdElement, cellObj, cellData);

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
			cellData = cellElement.createFilterData(config, tdElement, cellObj, {});

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.filterCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';

			cellElement.createDataContainer(config, tdElement, cellObj, cellData);

			if (cellObj.filterDisabled) {
				tdElement.classList.add(config.inner.selectors.filterDisabled);
			}

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < rowsNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[config.inner.indexOfCellKeyHeader].length; j++) {
			cellObj = configUtil.getFixedKeyHeader(config)[j];

			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);

			cellElement.createDataContainer(config, tdElement, cellObj);

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	elementHolder.fixedHeaderTable.appendChild(fixedThead);
	elementHolder.fixedTable.appendChild(fixedTbody);
}

function appendTableToDOM(config, elementHolder) {
	var mainContainer = document.querySelector(config.selectors.mainContainer);

	mainContainer.setAttribute('id', config.inner.selectors.uniqueId);

	mainContainer.appendChild(elementHolder.fixedHeaderContainer);
	mainContainer.appendChild(elementHolder.dataHeaderContainer);
	mainContainer.appendChild(elementHolder.fixedContainer);
	mainContainer.appendChild(elementHolder.dataContainer);
}

function getDefaultOptions() {
	return dataUtil.cloneObject(globalConfig.DEFAULTS);
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable,
	getDefaultOptions: getDefaultOptions
};