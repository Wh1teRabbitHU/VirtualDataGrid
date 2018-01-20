'use strict';

function indexOfElement(element) {
	var collection = element.parentNode.childNodes;

	for (var i = 0; i < collection.length; i++) {
		if (collection[i] === element) {
			return i;
		}
	}

	return -1;
}

function findParentNode(child, selector) {
	if (child.parentNode === null) {
		return null;
	} else if (child.parentNode.matches(selector)) {
		return child.parentNode;
	}

	return findParentNode(child.parentNode, selector);
}

function getRowNumber(config, cellNode) {
	return indexOfElement(cellNode.parentNode) + config.inner.topCellOffset;
}

function getColumnNumber(config, cellNode) {
	return indexOfElement(cellNode) - 1 + config.inner.leftCellOffset;
}

function isEllipsisActive(element) {
	return element.offsetWidth < element.scrollWidth;
}

function isOverflown(element) {
	return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

module.exports = {
	indexOfElement: indexOfElement,
	findParentNode: findParentNode,
	getRowNumber: getRowNumber,
	getColumnNumber: getColumnNumber,
	isEllipsisActive: isEllipsisActive,
	isOverflown: isOverflown
};