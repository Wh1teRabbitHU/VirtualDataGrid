'use strict';

function calculateVirtualContainerHeight(instance, height) {
	if (typeof height == 'undefined') {
		return height;
	}

	return instance.tableHeightOffset + Math.floor(height / instance.cellHeight) * instance.cellHeight;
}

function getDefaultContainerHeight(instance) {
	return calculateVirtualContainerHeight(instance, window.innerHeight - document.querySelector(instance.containerSelector).getBoundingClientRect().top - 64);
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
	return Math.floor((instance.containerHeight - instance.tableHeightOffset) / instance.cellHeight) - instance.headers.length;
}

function getVisibleColumnNumber(instance) {
	return Math.floor(document.querySelector('.' + instance.virtualContainerClass).offsetWidth / instance.cellWidth +
		(instance.colspanOffset > 2 ? instance.colspanOffset : 2) + instance.colspanOffset);
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
	nil: nil
};