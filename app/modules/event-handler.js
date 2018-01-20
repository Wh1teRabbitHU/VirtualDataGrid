'use strict';

var domUtil       = require('../utils/dom'),
	keyboardUtil  = require('../utils/keyboard'),
	sortModule    = require('../modules/sort'),
	editModule    = require('../modules/edit'),
	domModule     = require('../modules/dom'),
	filterModule  = require('../modules/filter'),
	resizeModule  = require('../modules/resize'),
	tooltipModule = require('../modules/tooltip');

var container;

var instances = {
	onScrollEventHandler: function() {},
	onWheelEventHandler: function() {},
	onInputBlurEventHandler: function() {},
	onClickCellEventHandler: function() {},
	onClickSaveButtonEventHandler: function() {},
	onClickSortHeader: function() {},
	onClickFilterHeader: function() {},
	onWindowResize: function() {},
	onMouseEnterCellWithTitle: function() {},
	onMouseLeaveCellWithTitle: function() {},
};

function onWheelEventHandler(event, config) {
	event.preventDefault();

	if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
		container.scrollTop += event.deltaY;
		container.scrollLeft += event.deltaX;
	} else if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
		container.scrollTop += event.deltaY * config.inner.dimensions.scrollLineHeight;
		container.scrollLeft += event.deltaX * config.inner.dimensions.scrollLineHeight;
	} else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		container.scrollTop += event.deltaY * config.inner.dimensions.scrollPageHeight;
		container.scrollLeft += event.deltaX * config.inner.dimensions.scrollPageHeight;
	}
}

function onScrollEventHandler(event, config) {
	tooltipModule.hideAll(config);

	domModule.resetEditingCell(config, instances.onInputBlurEventHandler);
	domModule.updateBuffers(config);
	domModule.updateTable(config, false);
}

function onClickCellEventHandler(event, config) {
	if (!event.target.matches('.' + config.inner.selectors.cellDataContainer)) {
		return;
	}

	editModule.startEditingCell(config, event.target.parentNode, instances, {
		onInputBlurEventHandler: onInputBlurEventHandler,
		onInputKeyUpEventHandler: onInputKeyUpEventHandler
	});
}

function onInputBlurEventHandler(event, config) {
	editModule.finishEditingCell(config, event.target, {
		onInputBlurEventHandler: onInputBlurEventHandler,
		onInputKeyUpEventHandler: onInputKeyUpEventHandler
	});
}

function onInputKeyUpEventHandler(event, config) {
	var keyCode = keyboardUtil.getKeyCode(event);

	switch (keyCode) {
		case keyboardUtil.KEY_CODES.ENTER:
			event.target.removeEventListener('blur', instances.onInputBlurEventHandler);
			editModule.finishEditingCell(config, event.target, {
				onInputBlurEventHandler: onInputBlurEventHandler,
				onInputKeyUpEventHandler: onInputKeyUpEventHandler
			});
			break;
		case keyboardUtil.KEY_CODES.ESCAPE:
			editModule.cancelEditingCell(config, event.target, {
				onInputBlurEventHandler: onInputBlurEventHandler,
				onInputKeyUpEventHandler: onInputKeyUpEventHandler
			});
			break;
		default:
			break;
	}
}

function onClickSaveButtonEventHandler(event, config) {
	editModule.saveCells(config);
}

function onClickSortHeader(event, config) {
	var sortCellSelector = '.' + config.inner.selectors.sortCell,
		sortContainerSelector = sortCellSelector + ' .' + config.inner.selectors.cellDataContainer,
		sortDisabledSelector = '.' + config.inner.selectors.sortDisabled,
		sortIconSelector = sortCellSelector + ' .' + config.inner.selectors.sortIcon;

	if (!event.target.matches(sortContainerSelector) &&
		!event.target.matches(sortIconSelector) ||
		event.target.matches(sortDisabledSelector)) {
		return;
	}

	if (event.target.matches(sortIconSelector)) {
		sortModule.resetSort(config);
	}

	if (event.target.matches(sortContainerSelector)) {
		sortModule.sortByColumn(config, domUtil.findParentNode(event.target, sortCellSelector));
	}
}

function onClickFilterHeader(event, config) {
	var filterCellSelector = '.' + config.inner.selectors.filterCell,
		filterContainerSelector = filterCellSelector + ' .' + config.inner.selectors.cellDataContainer,
		filterDisabledSelector = '.' + config.inner.selectors.filterDisabled,
		filterSearchIconSelector = filterCellSelector + ' .' + config.inner.selectors.filterSearchIcon,
		filterClearIconSelector = filterCellSelector + ' .' + config.inner.selectors.filterClearIcon;

	if (!event.target.matches(filterContainerSelector) &&
		!event.target.matches(filterSearchIconSelector) &&
		!event.target.matches(filterClearIconSelector) ||
		event.target.matches(filterDisabledSelector)) {

		return;
	}

	var cellNode = domUtil.findParentNode(event.target, filterCellSelector);

	if (event.target.matches(filterClearIconSelector)) {
		filterModule.clearFilter(config, cellNode);

		return;
	}

	filterModule.startEditingFilter(config, cellNode);
}

function onWindowResize(event, config) {
	if (document.querySelector('#' + config.inner.selectors.uniqueId) === null) {
		return;
	}

	resizeModule.resizeEventHandler(config);
}

function onMouseEnterCellWithTitle(event, config) {
	tooltipModule.onMouseEnterCellWithTitle(config, event.target);
}

function onMouseLeaveCellWithTitle(event, config) {
	tooltipModule.onMouseLeaveCellWithTitle(config, event.target);
}

function addEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	instances.onScrollEventHandler = function(event) { onScrollEventHandler(event, config); };
	instances.onWheelEventHandler = function(event) { onWheelEventHandler(event, config); };
	instances.onClickCellEventHandler = function(event) { onClickCellEventHandler(event, config); };
	instances.onClickSaveButtonEventHandler = function(event) { onClickSaveButtonEventHandler(event, config); };
	instances.onClickSortHeader = function(event) { onClickSortHeader(event, config); };
	instances.onClickFilterHeader = function(event) { onClickFilterHeader(event, config); };
	instances.onWindowResize = function(event) { onWindowResize(event, config); };
	instances.onMouseEnterCellWithTitle = function(event) { onMouseEnterCellWithTitle(event, config); };
	instances.onMouseLeaveCellWithTitle = function(event) { onMouseLeaveCellWithTitle(event, config); };

	if (container !== null) {
		container.addEventListener('wheel', instances.onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.modules.tooltip.enabled) {
		document.querySelectorAll('[title]').forEach(function(el) {
			el.addEventListener('mouseenter', instances.onMouseEnterCellWithTitle);
			el.addEventListener('mouseleave', instances.onMouseLeaveCellWithTitle);
		});
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).addEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.addEventListener('click', instances.onClickCellEventHandler);
		});
	}

	if (config.sort.enabled) {
		document.querySelectorAll('#' + config.inner.selectors.uniqueId + ' td.' + config.inner.selectors.sortCell).forEach(function(el) {
			el.addEventListener('click', instances.onClickSortHeader);
		});
	}

	if (config.filter.enabled) {
		document.querySelectorAll('#' + config.inner.selectors.uniqueId + ' td.' + config.inner.selectors.filterCell).forEach(function(el) {
			el.addEventListener('click', instances.onClickFilterHeader);
		});
	}

	if (config.autoResize) {
		window.addEventListener('resize', instances.onWindowResize);
	}
}

function removeEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	if (container !== null) {
		container.removeEventListener('wheel', instances.onWheelEventHandler);
		container.removeEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.modules.tooltip.enabled) {
		document.querySelectorAll('[title]').forEach(function(el) {
			el.removeEventListener('mouseenter', instances.onMouseEnterCellWithTitle);
			el.removeEventListener('mouseleave', instances.onMouseLeaveCellWithTitle);
		});
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).removeEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.removeEventListener('click', instances.onClickCellEventHandler);
		});
	}

	if (config.sort.enabled) {
		document.querySelectorAll('#' + config.inner.selectors.uniqueId + ' td.' + config.inner.selectors.sortCell).forEach(function(el) {
			el.removeEventListener('click', instances.onClickSortHeader);
		});
	}

	if (config.filter.enabled) {
		document.querySelectorAll('#' + config.inner.selectors.uniqueId + ' td.' + config.inner.selectors.filterCell).forEach(function(el) {
			el.removeEventListener('click', instances.onClickFilterHeader);
		});
	}

	if (config.autoResize) {
		window.removeEventListener('resize', instances.onWindowResize);
	}
}

module.exports = {
	addEvents: addEvents,
	removeEvents: removeEvents
};