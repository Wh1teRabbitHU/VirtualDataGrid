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

function getHeaderCellHtml(config, cell, cellObj, isLastRow) {
	var innerHTML = '',
		columnText = cellObj.text || cellObj.key || '';

	if (config.sort.enabled && !cellObj.sortDisabled && isLastRow) {
		var attribute = cellObj.key,
			direction = typeof attribute != 'undefined' && config.inner.sort.attribute === attribute ? config.inner.sort.direction : 'none',
			isSorted = direction !== 'none',
			iconClass = direction === 'down' ? config.inner.icons.sort.asc : config.inner.icons.sort.desc,
			iconElementClass = config.inner.selectors.sortIcon + (isSorted ? ' ' + iconClass : ' hidden');

		innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';

		cell.setAttribute('data-attribute', attribute);
	}

	innerHTML += columnText;

	return innerHTML;
}

function getFilterCellHtml(config, cell, cellObj, filterObj) {
	var innerHTML = '',
		iconClass = config.inner.icons.filter.search,
		iconElementClass = config.inner.selectors.filterSearchIcon + ' ' + iconClass,
		clearIconClass = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	if (!cellObj.filterDisabled) {
		innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';
		innerHTML += filterObj.value || '';

		if (typeof filterObj.value != 'undefined' && filterObj.value !== '') {
			innerHTML += '<i class="' + clearIconElementClass + '" aria-hidden="true"></i>';
		}
	}

	return innerHTML;
}

function findParentNode(child, selector) {
	if (child.parentNode === null) {
		return null;
	} else if (child.parentNode.matches(selector)) {
		return child.parentNode;
	}

	return findParentNode(child.parentNode, selector);
}

function getRowNumber(config, cell) {
	return indexOfElement(cell.parentNode) + config.inner.topCellOffset;
}

function getColumnNumber(config, cell) {
	return indexOfElement(cell) - 1 + config.inner.leftCellOffset;
}

function isEllipsisActive(element) {
	return element.offsetWidth < element.scrollWidth;
}

function isOverflown(element) {
	return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

module.exports = {
	indexOfElement: indexOfElement,
	getHeaderCellHtml: getHeaderCellHtml,
	getFilterCellHtml: getFilterCellHtml,
	findParentNode: findParentNode,
	getRowNumber: getRowNumber,
	getColumnNumber: getColumnNumber,
	isEllipsisActive: isEllipsisActive,
	isOverflown: isOverflown
};