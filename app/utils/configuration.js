'use strict';

function calculateVirtualContainerHeight(config, height) {
	if (typeof height == 'undefined') {
		return height;
	}

	return config.inner.tableHeightOffset + Math.floor(height / config.dimensions.cellHeight) * config.dimensions.cellHeight;
}

function getDefaultContainerHeight(config) {
	return calculateVirtualContainerHeight(config, window.innerHeight - document.querySelector(config.selectors.mainContainer).getBoundingClientRect().top - 64);
}

function getIndexOfCellKeyHeader(config) {
	return config.headers.length - 1;
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
	return Math.floor((config.dimensions.containerHeight - config.inner.tableHeightOffset) / config.dimensions.cellHeight) - config.headers.length;
}

function getVisibleColumnNumber(config) {
	return Math.floor(document.querySelector('.' + config.selectors.virtualContainer).offsetWidth / config.dimensions.cellWidth +
		(config.inner.colspanOffset > 2 ? config.inner.colspanOffset : 2) + config.inner.colspanOffset);
}

function getTableWidth(config) {
	return (config.headers[config.inner.indexOfCellKeyHeader].length - config.inner.visibleColumnNumber) * config.dimensions.cellWidth;
}

function getTableHeight(config) {
	return (config.dataSource.length - config.inner.visibleRowNumber + 1) * config.dimensions.cellHeight;
}

function nil() {
	return function() {};
}

module.exports = {
	calculateVirtualContainerHeight: calculateVirtualContainerHeight,
	getDefaultContainerHeight: getDefaultContainerHeight,
	getIndexOfCellKeyHeader: getIndexOfCellKeyHeader,
	getMaxColspan: getMaxColspan,
	getVisibleRowNumber: getVisibleRowNumber,
	getVisibleColumnNumber: getVisibleColumnNumber,
	getTableWidth: getTableWidth,
	getTableHeight: getTableHeight,
	nil: nil
};