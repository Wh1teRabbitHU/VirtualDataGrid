'use strict';

var domUtil = require('./dom');

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
	return config.headers[config.headers.length - 1][0].key;
}

function getMaxColspan(config) {
	var maxVal = 0;

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
	return Math.floor(document.querySelector('.' + config.selectors.virtualContainer).offsetWidth / domUtil.getCellFullWidth(config) +
		(config.inner.colspanOffset > 2 ? config.inner.colspanOffset : 2) + config.inner.colspanOffset);
}

function getTableOffsetWidth(config) {
	var tabbleOffsetColumns = config.headers[config.inner.indexOfCellKeyHeader].length < config.inner.visibleColumnNumber ? 0 : config.headers[config.inner.indexOfCellKeyHeader].length - config.inner.visibleColumnNumber;

	return tabbleOffsetColumns * domUtil.getCellFullWidth(config);
}

function getTableOffsetHeight(config) {
	var tableOffsetRows = config.dataSource.length < config.inner.visibleRowNumber ? 0 : config.dataSource.length - config.inner.visibleRowNumber + 1;

	return tableOffsetRows * config.dimensions.cellHeight;
}

function nil() {
	return function() {};
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
	nil: nil
};