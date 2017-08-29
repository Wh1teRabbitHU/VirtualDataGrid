'use strict';

var configUtil = require('../utils/configuration'),
	domModule  = require('../modules/dom');

var DELAY = 200;

var isEventDelayed = false;

function redrawTable(config) {
	var prevRowNumber = config.inner.visibleRowNumber,
		prevColumnNumber = config.inner.visibleColumnNumber;

	config.dimensions.containerHeight = configUtil.calculateVirtualContainerHeight(config, configUtil.getDefaultContainerHeight(config));
	config.inner.visibleRowNumber = configUtil.getVisibleRowNumber(config);
	config.inner.visibleColumnNumber = configUtil.getVisibleColumnNumber(config);
	config.inner.tableOffsetWidth = configUtil.getTableOffsetWidth(config);
	config.inner.tableOffsetHeight = configUtil.getTableOffsetHeight(config);

	var i, lastRow, lastColumns;

	if (prevRowNumber === config.inner.visibleRowNumber &&
		prevColumnNumber === config.inner.visibleColumnNumber) {

		return;
	}

	var virtualContainerSelector = '#' + config.inner.selectors.uniqueId + ' .' + config.selectors.virtualContainer,
		lastFixedRowSelector = '#' + config.inner.selectors.uniqueId + ' .' + config.selectors.fixedTable + ' .data-row:last-of-type',
		lastVirtualRowSelector = '#' + config.inner.selectors.uniqueId + ' .' + config.selectors.virtualTable + ' .data-row:nth-last-of-type(2)',
		lastVirtualColumn = '#' + config.inner.selectors.uniqueId + ' .' + config.selectors.virtualTable + ' td:nth-last-of-type(2)';

	var virtualContainer = document.querySelector(virtualContainerSelector);

	virtualContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	virtualContainer.style.height = config.dimensions.containerHeight + 'px';

	if (prevRowNumber < config.inner.visibleRowNumber) { // Ha több sor lett
		for (i = 0; i < config.inner.visibleRowNumber - prevRowNumber; i++) {
			lastRow = document.querySelector(lastFixedRowSelector);
			lastRow.parentNode.insertBefore(lastRow.cloneNode(true), lastRow);

			lastRow = document.querySelector(lastVirtualRowSelector);
			lastRow.parentNode.insertBefore(lastRow.cloneNode(true), lastRow);
		}
	} else if (prevRowNumber > config.inner.visibleRowNumber) { // Ha kevesebb sor lett
		for (i = 0; i < prevRowNumber - config.inner.visibleRowNumber; i++) {
			lastRow = document.querySelector(lastFixedRowSelector);
			lastRow.remove();

			lastRow = document.querySelector(lastVirtualRowSelector);
			lastRow.remove();
		}
	}

	if (prevColumnNumber < config.inner.visibleColumnNumber) { // Ha több oszlop lett
		for (i = 0; i < config.inner.visibleColumnNumber - prevColumnNumber; i++) {
			lastColumns = document.querySelectorAll(lastVirtualColumn);
			lastColumns.forEach(function(column) {
				column.parentNode.insertBefore(column.cloneNode(true), column);
			});
		}
	} else if (prevColumnNumber > config.inner.visibleColumnNumber) { // Ha kevesebb oszlop lett
		for (i = 0; i < prevColumnNumber - config.inner.visibleColumnNumber; i++) {
			lastColumns = document.querySelectorAll(lastVirtualColumn);
			lastColumns.forEach(function(column) {
				column.remove();
			});
		}
	}

	domModule.updateBuffers(config);
	domModule.updateTable(config);
}

function resizeEventHandler(config) {
	if (!isEventDelayed) {
		isEventDelayed = true;

		window.setTimeout(function() {
			isEventDelayed = false;

			redrawTable(config);
		}, DELAY);
	}
}

module.exports = {
	resizeEventHandler: resizeEventHandler
};