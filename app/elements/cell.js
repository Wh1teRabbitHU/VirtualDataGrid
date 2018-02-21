'use strict';

var domUtils = require('../utils/dom');

function createDataContainer(config, cellNode, data) {
	var dataContainer = document.createElement('div'),
		maxHeight = config.dimensions.cellHeight - config.dimensions.cellBorderWidth - config.dimensions.cellPaddingVertical * 2;

	dataContainer.classList.add(config.inner.selectors.cellDataContainer);
	dataContainer.style.minWidth = config.dimensions.cellWidth + 'px';
	dataContainer.style.maxHeight = maxHeight + 'px';
	dataContainer.style.padding = config.dimensions.cellPaddingVertical + 'px ' + config.dimensions.cellPaddingHorizontal + 'px';

	cellNode.appendChild(dataContainer);

	if (typeof data != 'undefined') {
		updateDataContainer(config, cellNode, data);
	}

	return dataContainer;
}

function createHeaderData(config, cellNode, cellObj, isLastRow) {
	var innerHTML = '',
		columnText = cellObj.text || cellObj.key || '';

	if (config.sort.enabled && !cellObj.sortDisabled && isLastRow) {
		var attribute = cellObj.key,
			direction = typeof attribute != 'undefined' && config.inner.sort.attribute === attribute ? config.inner.sort.direction : 'none',
			isSorted = direction !== 'none',
			iconClass = direction === 'down' ? config.inner.icons.sort.asc : config.inner.icons.sort.desc,
			iconElementClass = config.inner.selectors.sortIcon + (isSorted ? ' ' + iconClass : ' hidden');

		innerHTML += '<i class="' + iconElementClass + '" aria-hidden="true"></i>';

		cellNode.setAttribute('data-attribute', attribute);
	}

	innerHTML += columnText;

	return innerHTML;
}

function createFilterData(config, cellNode, cellObj, filterObj) {
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

function updateDataContainer(config, cellNode, data) {
	var dataContainer = cellNode.querySelector('.' + config.inner.selectors.cellDataContainer);

	if (typeof data == 'undefined' || data === null) {
		dataContainer.innerHTML = '';
		cellNode.title = '';
	} else if (data.nodeType) { // If its an Element object
		dataContainer.innerHTML = '';
		dataContainer.appendChild(data);
		cellNode.title = data.textContent;
	} else { // else just add to the containers innerHTML
		dataContainer.innerHTML = data;
		cellNode.title = dataContainer.textContent;
	}

	cellNode.classList.toggle(config.inner.selectors.overflowedCell, domUtils.isOverflown(cellNode));
}

function updateCell(config, cellNode, cellData) {
	updateDataContainer(config, cellNode, cellData.getValue());

	cellNode.className = config.inner.selectors.dataCell + ' ' + (cellData.class || '');
	cellNode.classList.toggle(config.inner.selectors.overflowedCell, domUtils.isOverflown(cellNode));
}

module.exports = {
	createDataContainer: createDataContainer,
	createHeaderData: createHeaderData,
	createFilterData: createFilterData,
	updateDataContainer: updateDataContainer,
	updateCell: updateCell
};