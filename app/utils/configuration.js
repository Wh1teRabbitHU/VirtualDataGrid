'use strict';

function calculateVirtualContainerHeight(instance, height) {
	if (typeof height == 'undefined') {
		return height;
	}

	return instance.inner.tableHeightOffset + Math.floor(height / instance.dimensions.cellHeight) * instance.dimensions.cellHeight;
}

function getDefaultContainerHeight(instance) {
	return calculateVirtualContainerHeight(instance, window.innerHeight - document.querySelector(instance.selectors.mainContainer).getBoundingClientRect().top - 64);
}

function getIndexOfCellKeyHeader(instance) {
	return instance.headers.length - 1;
}

function getMaxColspan(instance) {
	var maxVal = 0;

	instance.headers.forEach(function(element) {
		element.forEach(function(subElement) {
			if (typeof subElement.colspan != 'undefined' && maxVal < subElement.colspan) {
				maxVal = subElement.colspan;
			}
		});
	});

	return maxVal;
}

function getVisibleRowNumber(instance) {
	return Math.floor((instance.dimensions.containerHeight - instance.inner.tableHeightOffset) / instance.dimensions.cellHeight) - instance.headers.length;
}

function getVisibleColumnNumber(instance) {
	return Math.floor(document.querySelector('.' + instance.selectors.virtualContainer).offsetWidth / instance.dimensions.cellWidth +
		(instance.inner.colspanOffset > 2 ? instance.inner.colspanOffset : 2) + instance.inner.colspanOffset);
}

function getTableWidth(instance) {
	return (instance.headers[instance.inner.indexOfCellKeyHeader].length - instance.inner.visibleColumnNumber) * instance.dimensions.cellWidth;
}

function getTableHeight(instance) {
	return (instance.dataSource.length - instance.inner.visibleRowNumber + 1) * instance.dimensions.cellHeight;
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