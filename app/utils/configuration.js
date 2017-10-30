'use strict';

function calculateVirtualContainerHeight(config, height) {
	if (typeof height == 'undefined') {
		return height;
	}

	return config.inner.minBufferHeight * 2 + Math.floor(height / config.dimensions.cellHeight) * config.dimensions.cellHeight;
}

function getDefaultContainerHeight(config) {
	return calculateVirtualContainerHeight(config, window.innerHeight - document.querySelector(config.selectors.mainContainer).getBoundingClientRect().top - 64);
}

function getIndexOfCellKeyHeader(config) {
	return config.headers.length - 1;
}

function getSortDefault(config) {
	return config.uniqueRowKey;
}

function getMaxColspan(config) {
	var maxVal = 1;

	config.headers.forEach(function(element) {
		element.forEach(function(subElement) {
			if (typeof subElement.colspan != 'undefined' && maxVal < subElement.colspan) {
				maxVal = subElement.colspan;
			}
		});
	});

	return maxVal;
}

function getVisibleRowNumber(config) {
	var hasFilter = config.filter.enabled,
		containerHeight = config.dimensions.containerHeight - config.inner.minBufferHeight * 2,
		dataCells = Math.floor(containerHeight / config.dimensions.cellHeight),
		headerCells = config.headers.length + (hasFilter ? 1 : 0);

	return dataCells - headerCells;
}

function getVisibleColumnNumber(config) {
	return Math.floor(document.querySelector('.' + config.selectors.virtualContainer).offsetWidth / getCellFullWidth(config) +
		(config.inner.colspanOffset > 2 ? config.inner.colspanOffset : 2) + config.inner.colspanOffset);
}

function getTableOffsetWidth(config) {
	var tabbleOffsetColumns = getKeyHeader(config).length < config.inner.visibleColumnNumber ? config.inner.minBufferWidth : getKeyHeader(config).length - config.inner.visibleColumnNumber;

	return tabbleOffsetColumns * getCellFullWidth(config);
}

function getTableOffsetHeight(config) {
	var tableOffsetRows = config.dataSource.length < config.inner.visibleRowNumber ? config.inner.minBufferHeight : config.dataSource.length - config.inner.visibleRowNumber + 1;

	return tableOffsetRows * config.dimensions.cellHeight;
}

function getCellFullWidth(config) {
	return config.dimensions.cellPaddingHorizontal * 2 + config.dimensions.cellWidth + config.dimensions.cellBorderWidth;
}

function getKeyHeader(config) {
	return config.headers[config.inner.indexOfCellKeyHeader];
}

function getFixedKeyHeader(config) {
	return config.fixedHeaders[config.inner.indexOfCellKeyHeader];
}

function getHeaderObject(config, attribute) {
	return getKeyHeader(config).find(function(column) {
		return column.key === attribute;
	}) || getFixedKeyHeader(config).find(function(column) {
		return column.key === attribute;
	});
}

function nil() {
	return function() {};
}

function wrapper(f) {
	return function() { return f; };
}

module.exports = {
	calculateVirtualContainerHeight: calculateVirtualContainerHeight,
	getDefaultContainerHeight: getDefaultContainerHeight,
	getIndexOfCellKeyHeader: getIndexOfCellKeyHeader,
	getSortDefault: getSortDefault,
	getMaxColspan: getMaxColspan,
	getVisibleRowNumber: getVisibleRowNumber,
	getVisibleColumnNumber: getVisibleColumnNumber,
	getTableOffsetWidth: getTableOffsetWidth,
	getTableOffsetHeight: getTableOffsetHeight,
	getCellFullWidth: getCellFullWidth,
	getKeyHeader: getKeyHeader,
	getFixedKeyHeader: getFixedKeyHeader,
	getHeaderObject: getHeaderObject,
	nil: nil,
	wrapper: wrapper
};