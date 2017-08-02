(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var configuration = {};

module.exports = configuration;
},{}],2:[function(require,module,exports){
'use strict';

function CellObject(p) {
	var self = this;

	initAttr('key');
	initAttr('value');
	initAttr('class');
	initAttr('rowNumber');
	initAttr('columnNumber');

	function initAttr(name) {
		self[name] = typeof p == 'undefined' || typeof p[name] == 'undefined' ? null : p[name];
	}

	this.updateAttributes = function(attrs) {
		Object.keys(attrs).forEach(function(k) {
			if (typeof attrs[k] != 'undefined' && typeof self[k] != 'undefined') {
				self[k] = attrs[k];
			}
		});
	};
}

module.exports = CellObject;
},{}],3:[function(require,module,exports){
'use strict';

function EventArguments(p) {
	var self = this;

	initAttr('cell');
	initAttr('cellObject');
	initAttr('cancelEvent');

	function initAttr(name) {
		self[name] = typeof p == 'undefined' || typeof p[name] == 'undefined' ? null : p[name];
	}

	this.updateAttributes = function(attrs) {
		Object.keys(attrs).forEach(function(k) {
			if (typeof attrs[k] != 'undefined' && typeof self[k] != 'undefined') {
				self[k] = attrs[k];
			}
		});
	};
}

module.exports = EventArguments;
},{}],4:[function(require,module,exports){
'use strict';

var configInstance = require('../instances/configuration');

var configUtil = require('../utils/configuration'),
	generatorUtil = require('../utils/generator');

var DEFAULTS = {
	selectors: {
		mainContainer: '.data-container',
		fixedContainer: 'fixed-container',
		fixedTable: 'fixed-table',
		virtualContainer: 'virtual-container',
		virtualTable: 'virtual-table',
		editingCell: 'editing-cell',
		editedCell: 'edited-cell',
		saveButton: 'btn-save'
	},
	dimensions: {
		cellWidth: 150,
		cellHeight: 50,
		containerHeight: configUtil.getDefaultContainerHeight,
	},
	edit: {
		enabled: false
	},
	eventHandlers: {
		onBeforeEdit: configUtil.nil,
		onValidation: configUtil.nil,
		onAfterEdit: configUtil.nil,
		onBeforeSave: configUtil.nil,
		onAfterSave: configUtil.nil
	},
	dataSource: [ {} ],
	headers: [ [ {} ] ],
	fixedHeaders: [ [ {} ] ],
	inner: {}
};

function init(options) {
	initInnerStaticValues();

	updateValue('selectors.mainContainer', options);
	updateValue('selectors.fixedContainer', options);
	updateValue('selectors.fixedTable', options);
	updateValue('selectors.virtualContainer', options);
	updateValue('selectors.virtualTable', options);
	updateValue('selectors.editingCell', options);
	updateValue('selectors.editedCell', options);
	updateValue('dimensions.cellWidth', options);
	updateValue('dimensions.cellHeight', options);

	calculateVirtualContainerHeight(options);

	generatorUtil.initContainers(configInstance);

	updateValue('dataSource', options);
	updateValue('headers', options);
	updateValue('fixedHeaders', options);
	updateValue('edit.enabled', options);
	updateValue('selectors.saveButton', options);
	updateValue('visibleColumnNumber', options);
	updateValue('onBeforeEdit', options);
	updateValue('onValidation', options);
	updateValue('onAfterEdit', options);
	updateValue('onBeforeSave', options);
	updateValue('onAfterSave', options);

	initInnerCalculatedValues();
}

function initInnerStaticValues() {
	configInstance.inner = {};
	configInstance.inner.selectors = {};

	configInstance.inner.selectors.bufferRowTop = 'buffer-row-top';
	configInstance.inner.selectors.bufferRowBottom = 'buffer-row-bottom';
	configInstance.inner.selectors.bufferColumnLeft = 'buffer-column-left';
	configInstance.inner.selectors.bufferColumnRight = 'buffer-column-right';
	configInstance.inner.selectors.headerRow = 'header-row';
	configInstance.inner.selectors.headerCell = 'header-cell';
	configInstance.inner.selectors.dataRow = 'data-row';
	configInstance.inner.selectors.dataCell = 'data-cell';

	// Minimum buffer cell height. Azért van rá szükség, mert ha nincs megadva, akkor ugrik egyett a scroll ha a végére vagy az elejére értünk a táblázatban
	configInstance.inner.minCellHeight = 2;

	// Az offset miatt kell a számoláshoz
	configInstance.inner.tableHeightOffset = configInstance.inner.minCellHeight * 2;
	configInstance.inner.editedCells = [];
	configInstance.inner.leftCellOffset = 0;
	configInstance.inner.topCellOffset = 0;
}

function calculateVirtualContainerHeight(options) {
	var containerHeight = getInnerValue(options, 'dimensions.containerHeight');

	if (typeof containerHeight == 'undefined') {
		containerHeight = configUtil.getDefaultContainerHeight(configInstance);
	}

	updateValue('dimensions.containerHeight', configUtil.calculateVirtualContainerHeight(configInstance, containerHeight));
}

function initInnerCalculatedValues() {
	configInstance.inner.indexOfCellKeyHeader = configUtil.getIndexOfCellKeyHeader(configInstance);
	configInstance.inner.colspanOffset = configUtil.getMaxColspan(configInstance);
	configInstance.inner.visibleRowNumber = configUtil.getVisibleRowNumber(configInstance);
	configInstance.inner.visibleColumnNumber = configUtil.getVisibleColumnNumber(configInstance);
	configInstance.tableWidth = configUtil.getTableWidth(configInstance);
	configInstance.tableHeight = configUtil.getTableHeight(configInstance);
}

function updateValue(key, options) {
	var target = getInnerObject(configInstance, key), // eslint-disable-line no-unused-vars
		value = getInnerValue(options, key),
		keys = key.split('.'),
		lastKey = keys[keys.length - 1];

	if (typeof value == 'undefined') {
		target[lastKey] = typeof getInnerValue(DEFAULTS, key) == 'function' ? getInnerValue(DEFAULTS, key)(configInstance) : getInnerValue(DEFAULTS, key);
	} else {
		target[lastKey] = value;
	}
}

function getInnerObject(object, key) {
	if (key.indexOf('.') === -1) {
		return object;
	}

	var subKey = key.split('.')[0],
		subObject = object[subKey];

	if (typeof subObject == 'undefined') {
		object[subKey] = {};
		subObject = object[subKey];
	}

	return getInnerObject(subObject, key.substring(key.indexOf('.') + 1));
}

function getInnerValue(object, key) {
	if (key.indexOf('.') === -1) {
		return object[key];
	}

	var subKey = key.split('.')[0],
		subObject = object[subKey];

	if (typeof subObject == 'undefined') {
		return subObject;
	}

	return getInnerValue(subObject, key.substring(key.indexOf('.') + 1));
}

module.exports = {
	init: init,
	updateValue: updateValue
};
},{"../instances/configuration":1,"../utils/configuration":8,"../utils/generator":12}],5:[function(require,module,exports){
'use strict';

var configuration    = require('./configuration'),
	eventHandlerUtil = require('../utils/event-handler'),
	generatorUtil    = require('../utils/generator'),
	domUtil          = require('../utils/dom');

var configInstance   = require('../instances/configuration');

function generateTable(id, options) {
	configuration.init(options);

	generatorUtil.initTable(configInstance);
	generatorUtil.initBuffers(configInstance);

	domUtil.updateTable();

	eventHandlerUtil.addEvents();
}

function destroyTable() {
	eventHandlerUtil.removeEvents();
	domUtil.destroyTable();
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable
};
},{"../instances/configuration":1,"../utils/dom":9,"../utils/event-handler":11,"../utils/generator":12,"./configuration":4}],6:[function(require,module,exports){
'use strict';

if (typeof Array.prototype.find == 'undefined') {
	Array.prototype.find = function(predicate) { // eslint-disable-line no-extend-native
		if (this === null) {
			throw new TypeError('Array.prototype.find called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}

		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		var value;

		for (var i = 0; i < length; i++) {
			value = list[i];
			if (predicate.call(thisArg, value, i, list)) {
				return value;
			}
		}

		return undefined; // eslint-disable-line no-undefined
	};
}
},{}],7:[function(require,module,exports){
'use strict';

if (!NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function(callback, argument) {
		argument = argument || window;

		for (var i = 0; i < this.length; i++) {
			callback.call(argument, this[i], i, this);
		}
	};
}
},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
'use strict';

var tableUtil = require('./table');

var configInstance = require('../instances/configuration');

function indexOfElement(element) {
	var collection = element.parentNode.childNodes;

	for (var i = 0; i < collection.length; i++) {
		if (collection[i] === element) {
			return i;
		}
	}

	return -1;
}

function updateCell(cell, cellObj) {
	cell.innerHTML = cellObj.value;
	cell.className = configInstance.inner.selectors.dataCell + ' ' + (cellObj.class || '');
}

function updateTable() {
	var countRow = 0,
		colspan = 1;

	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' tr.' + configInstance.inner.selectors.headerRow).forEach(function(row) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.headerCell).forEach(function(cell, cellNumber) {
			var cellObj = configInstance.headers[countRow][configInstance.inner.leftCellOffset + cellNumber];

			if (colspan > 1) {
				cell.style.display = 'none';
				colspan--;
			} else {
				cell.innerHTML = cellObj.text || cellObj.key || '';
				cell.style.display = 'table-cell';
			}

			if (typeof cellObj.colspan == 'undefined') {
				cell.removeAttribute('colspan');
			} else {
				var calculatedColspan = configInstance.inner.visibleColumnNumber <= cellNumber + cellObj.colspan ? configInstance.inner.visibleColumnNumber - cellNumber : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
			}
		});
		countRow++;
		colspan = 1;
	});

	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' tr.' + configInstance.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getCell(configInstance.inner.topCellOffset + rowNumber, configInstance.inner.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + configInstance.selectors.fixedTable + ' tr.' + configInstance.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getFixedCell(configInstance.inner.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(onInputBlurEventHandler) {
	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(configInstance.selectors.editingCell);
	});
}

function resetEditedCell() {
	document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.selectors.editingCell).forEach(function(editedCell) {
		editedCell.classList.remove(configInstance.selectors.editedCell);
	});

	configInstance.inner.editedCells = [];
	updateTable();
}

function destroyTable() {
	document.querySelector(configInstance.selectors.mainContainer).innerHTML = '';
}

module.exports = {
	indexOfElement: indexOfElement,
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable
};
},{"../instances/configuration":1,"./table":13}],10:[function(require,module,exports){
'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil = require('./table'),
	domUtil   = require('./dom');

var configInstance = require('../instances/configuration');

function saveCells() {
	if (!configInstance.edit.enabled) {
		return;
	}

	var args = new EventArguments({
		cellObject: configInstance.inner.editedCells,
		cancelEvent: false
	});

	configInstance.eventHandlers.onBeforeSave(args);

	if (!args.cancelEvent) {
		configInstance.inner.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell();

		configInstance.eventHandlers.onAfterSave(args);
	}
}

module.exports = {
	saveCells: saveCells
};
},{"../instances/configuration":1,"../models/event-arguments":3,"./dom":9,"./table":13}],11:[function(require,module,exports){
'use strict';

var EventArguments = require('../models/event-arguments');

var domUtil = require('../utils/dom'),
	tableUtil = require('../utils/table'),
	editUtil = require('../utils/edit'),
	generatorUtil = require('../utils/generator');

var configInstance = require('../instances/configuration');

var container;

function onWheelEventHandler(event) {
	event.preventDefault();

	container.scrollTop += event.deltaY;
	container.scrollLeft += event.deltaX;
}

function onScrollEventHandler() {
	domUtil.resetEditingCell(onInputBlurEventHandler);
	generatorUtil.initBuffers(configInstance);
	domUtil.updateTable();
}

function onInputBlurEventHandler() {
	var cell = this.parentNode,
		rowNumber = domUtil.indexOfElement(cell.parentNode) + configInstance.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + configInstance.inner.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: this.value,
		class: configInstance.selectors.editedCell
	});

	if (!tableUtil.isCellChanged(editedObj)) {
		domUtil.resetEditingCell(onInputBlurEventHandler);

		return;
	}

	var args = new EventArguments({
		cell: cell,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.eventHandlers.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(args.cellObject);
		domUtil.updateCell(args.cell, args.cellObject);

		configInstance.eventHandlers.onAfterEdit(args);
	}
}

function onClickCellEventHandler() {
	if (!configInstance.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(this.parentNode) + configInstance.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(this) - 1 + configInstance.inner.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: this,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.eventHandlers.onBeforeEdit(args);

	if (!args.cancelEvent) {
		this.classList.add(configInstance.selectors.editingCell);
		this.classList.remove(configInstance.selectors.editedCell);
		this.innerHTML = '';
		this.appendChild(input);

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', onInputBlurEventHandler);
	}
}

function addEvents() {
	container = document.querySelector('.' + configInstance.selectors.virtualContainer);

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', onScrollEventHandler);
	}

	if (configInstance.edit.enabled && configInstance.selectors.saveButton !== null) {
		document.querySelector(configInstance.selectors.saveButton).addEventListener('click', editUtil.saveCells);
	}

	if (configInstance.edit.enabled) {
		document.querySelectorAll('.' + configInstance.selectors.virtualTable + ' td.' + configInstance.inner.selectors.dataCell).forEach(function(el) {
			el.addEventListener('click', onClickCellEventHandler);
		});
	}
}

function removeEvents() {
	document.querySelector('.' + configInstance.selectors.virtualContainer).removeEventListener('scroll', onScrollEventHandler);
}

module.exports = {
	onClickCellEventHandler: onClickCellEventHandler,
	addEvents: addEvents,
	removeEvents: removeEvents
};
},{"../instances/configuration":1,"../models/event-arguments":3,"../utils/dom":9,"../utils/edit":10,"../utils/generator":12,"../utils/table":13}],12:[function(require,module,exports){
'use strict';

function initContainers(instance) {
	var container = document.querySelector(instance.selectors.mainContainer),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(instance.selectors.virtualContainer);
	virtualTable.classList.add(instance.selectors.virtualTable);
	fixedContainer.classList.add(instance.selectors.fixedContainer);
	fixedTable.classList.add(instance.selectors.fixedTable);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = instance.dimensions.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = instance.inner.minCellHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(instance) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr');

	trHeadBuffer.classList.add(instance.inner.selectors.bufferRowTopClass);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(instance.inner.selectors.bufferColumnLeft);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < instance.inner.visibleColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(instance.inner.selectors.bufferColumnRight);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	instance.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.inner.selectors.headerRow);
		trHead.style.height = instance.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < instance.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.headerCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
			tdElement.innerHTML = headerRow[j].text || headerRow[j].key || '';

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnRight);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual body
	for (i = 0; i < instance.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.inner.selectors.dataRow);
		trBody.style.height = instance.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnLeft);

		trBody.appendChild(tdElement);

		for (j = 0; j < instance.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.dataCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.inner.selectors.bufferColumnRight);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(instance.inner.selectors.bufferRowBottom);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + instance.selectors.virtualTable).appendChild(virtualThead);
	document.querySelector('.' + instance.selectors.virtualTable).appendChild(virtualTbody);

	instance.inner.bufferLeft = document.querySelectorAll('.' + instance.inner.selectors.bufferColumnLeft);
	instance.inner.bufferRight = document.querySelectorAll('.' + instance.inner.selectors.bufferColumnRight);
	instance.inner.bufferTop = document.querySelectorAll('.' + instance.inner.selectors.bufferRowTopClass);
	instance.inner.bufferBottom = document.querySelectorAll('.' + instance.inner.selectors.bufferRowBottom);

	// Generate fixed table

	if (instance.fixedHeaders.length === 0) {
		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < instance.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.inner.selectors.headerRow);
		trHead.style.height = instance.dimensions.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.headerCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';
			tdElement.innerHTML = instance.fixedHeaders[i][j].text || instance.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < instance.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.inner.selectors.dataRow);
		trBody.style.height = instance.dimensions.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[instance.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.inner.selectors.dataCell);
			tdElement.style.minWidth = instance.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + instance.selectors.fixedTable).appendChild(fixedThead);
	document.querySelector('.' + instance.selectors.fixedTable).appendChild(fixedTbody);
}

function initBuffers(instance) {
	var left = document.querySelector('.' + instance.selectors.virtualContainer).scrollLeft - document.querySelector('.' + instance.selectors.virtualContainer).scrollLeft % instance.dimensions.cellWidth - instance.inner.colspanOffset * instance.dimensions.cellWidth,
		right = instance.tableWidth - left,
		top = document.querySelector('.' + instance.selectors.virtualContainer).scrollTop,
		bottom = instance.tableHeight - top;

	left = left > instance.tableWidth ? instance.tableWidth : left;
	left = left < 0 ? 0 : left;
	right = instance.tableWidth - left;
	top = top + instance.inner.minCellHeight > instance.tableHeight ? instance.tableHeight + instance.inner.minCellHeight : top + instance.inner.minCellHeight;
	bottom = instance.tableHeight - top;

	instance.inner.leftCellOffset = Math.floor(left / instance.dimensions.cellWidth);
	instance.inner.topCellOffset = Math.floor((top - top % instance.dimensions.cellHeight) / instance.dimensions.cellHeight);

	instance.inner.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	instance.inner.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	instance.inner.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	instance.inner.bufferBottom.forEach(function(el) {
		el.style.height = bottom + 'px';
	});
}

module.exports = {
	initTable: initTable,
	initContainers: initContainers,
	initBuffers: initBuffers
};
},{}],13:[function(require,module,exports){
'use strict';

var Cell = require('../models/cell');

var configInstance = require('../instances/configuration');

function getCell(rowNumber, columnNumber) {
	var cellObj = configInstance.inner.editedCells.find(function(el) {
			return el.rowNumber === rowNumber && el.columnNumber === columnNumber;
		}),
		rowObj = configInstance.headers[configInstance.inner.indexOfCellKeyHeader];

	if (typeof cellObj == 'undefined') {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
		});

		cellObj.updateAttributes({
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});
	}

	return cellObj;
}

function getFixedCell(rowNumber, columnNumber) {
	var cellObj = null,
		rowObj = configInstance.fixedHeaders[configInstance.inner.indexOfCellKeyHeader];

	cellObj = new Cell({
		key: rowObj[columnNumber].key,
		value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
	});

	return cellObj;
}

function setCellValue(rowNumber, columnNumber, value) {
	var rowObj = configInstance.headers[configInstance.inner.indexOfCellKeyHeader];

	configInstance.dataSource[rowNumber][rowObj[columnNumber].key] = value;
}

function isCellChanged(cellObj) {
	var originalObj = getCell(cellObj.rowNumber, cellObj.columnNumber),
		editedObj = configInstance.inner.editedCells.find(function(el) {
			return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
		}),
		originalVal = originalObj.value || '';

	return originalVal !== cellObj.value || typeof editedObj != 'undefined';
}

function setUpdatedCellValue(cellObj) {
	var prev = configInstance.inner.editedCells.find(function(el) {
		return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
	});

	if (typeof prev == 'undefined') {
		configInstance.inner.editedCells.push(cellObj);
	} else {
		prev.value = cellObj.value;
	}
}

module.exports = {
	getCell: getCell,
	getFixedCell: getFixedCell,
	setCellValue: setCellValue,
	isCellChanged: isCellChanged,
	setUpdatedCellValue: setUpdatedCellValue
};
},{"../instances/configuration":1,"../models/cell":2}],14:[function(require,module,exports){
'use strict';

require('./pollyfills/Array.find.js');require('./pollyfills/NodeList.forEach.js');

var generator = require('./modules/generator');

var uniqueIdSequence = 1;

window.VirtualDataGrid = function() {
	var self = this;

	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.uniqueId, options);
	};
	self.destroyTable = generator.destroyTable;
	self.getId = function() {
		return self.uniqueId;
	};
};
},{"./modules/generator":5,"./pollyfills/Array.find.js":6,"./pollyfills/NodeList.forEach.js":7}]},{},[14]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25maWd1cmF0aW9uID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZmlndXJhdGlvbjtcbn0se31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsT2JqZWN0KHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdrZXknKTtcblx0aW5pdEF0dHIoJ3ZhbHVlJyk7XG5cdGluaXRBdHRyKCdjbGFzcycpO1xuXHRpbml0QXR0cigncm93TnVtYmVyJyk7XG5cdGluaXRBdHRyKCdjb2x1bW5OdW1iZXInKTtcblxuXHRmdW5jdGlvbiBpbml0QXR0cihuYW1lKSB7XG5cdFx0c2VsZltuYW1lXSA9IHR5cGVvZiBwID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBwW25hbWVdID09ICd1bmRlZmluZWQnID8gbnVsbCA6IHBbbmFtZV07XG5cdH1cblxuXHR0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycykge1xuXHRcdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcblx0XHRcdGlmICh0eXBlb2YgYXR0cnNba10gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGZba10gIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0c2VsZltrXSA9IGF0dHJzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxPYmplY3Q7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRBcmd1bWVudHMocCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aW5pdEF0dHIoJ2NlbGwnKTtcblx0aW5pdEF0dHIoJ2NlbGxPYmplY3QnKTtcblx0aW5pdEF0dHIoJ2NhbmNlbEV2ZW50Jyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEFyZ3VtZW50cztcbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG52YXIgY29uZmlnVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbmZpZ3VyYXRpb24nKSxcblx0Z2VuZXJhdG9yVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpO1xuXG52YXIgREVGQVVMVFMgPSB7XG5cdHNlbGVjdG9yczoge1xuXHRcdG1haW5Db250YWluZXI6ICcuZGF0YS1jb250YWluZXInLFxuXHRcdGZpeGVkQ29udGFpbmVyOiAnZml4ZWQtY29udGFpbmVyJyxcblx0XHRmaXhlZFRhYmxlOiAnZml4ZWQtdGFibGUnLFxuXHRcdHZpcnR1YWxDb250YWluZXI6ICd2aXJ0dWFsLWNvbnRhaW5lcicsXG5cdFx0dmlydHVhbFRhYmxlOiAndmlydHVhbC10YWJsZScsXG5cdFx0ZWRpdGluZ0NlbGw6ICdlZGl0aW5nLWNlbGwnLFxuXHRcdGVkaXRlZENlbGw6ICdlZGl0ZWQtY2VsbCcsXG5cdFx0c2F2ZUJ1dHRvbjogJ2J0bi1zYXZlJ1xuXHR9LFxuXHRkaW1lbnNpb25zOiB7XG5cdFx0Y2VsbFdpZHRoOiAxNTAsXG5cdFx0Y2VsbEhlaWdodDogNTAsXG5cdFx0Y29udGFpbmVySGVpZ2h0OiBjb25maWdVdGlsLmdldERlZmF1bHRDb250YWluZXJIZWlnaHQsXG5cdH0sXG5cdGVkaXQ6IHtcblx0XHRlbmFibGVkOiBmYWxzZVxuXHR9LFxuXHRldmVudEhhbmRsZXJzOiB7XG5cdFx0b25CZWZvcmVFZGl0OiBjb25maWdVdGlsLm5pbCxcblx0XHRvblZhbGlkYXRpb246IGNvbmZpZ1V0aWwubmlsLFxuXHRcdG9uQWZ0ZXJFZGl0OiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkJlZm9yZVNhdmU6IGNvbmZpZ1V0aWwubmlsLFxuXHRcdG9uQWZ0ZXJTYXZlOiBjb25maWdVdGlsLm5pbFxuXHR9LFxuXHRkYXRhU291cmNlOiBbIHt9IF0sXG5cdGhlYWRlcnM6IFsgWyB7fSBdIF0sXG5cdGZpeGVkSGVhZGVyczogWyBbIHt9IF0gXSxcblx0aW5uZXI6IHt9XG59O1xuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMpIHtcblx0aW5pdElubmVyU3RhdGljVmFsdWVzKCk7XG5cblx0dXBkYXRlVmFsdWUoJ3NlbGVjdG9ycy5tYWluQ29udGFpbmVyJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMuZml4ZWRDb250YWluZXInLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ3NlbGVjdG9ycy5maXhlZFRhYmxlJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcicsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLnZpcnR1YWxUYWJsZScsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLmVkaXRpbmdDZWxsJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMuZWRpdGVkQ2VsbCcsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnZGltZW5zaW9ucy5jZWxsV2lkdGgnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ2RpbWVuc2lvbnMuY2VsbEhlaWdodCcsIG9wdGlvbnMpO1xuXG5cdGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQob3B0aW9ucyk7XG5cblx0Z2VuZXJhdG9yVXRpbC5pbml0Q29udGFpbmVycyhjb25maWdJbnN0YW5jZSk7XG5cblx0dXBkYXRlVmFsdWUoJ2RhdGFTb3VyY2UnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ2hlYWRlcnMnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ2ZpeGVkSGVhZGVycycsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnZWRpdC5lbmFibGVkJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMuc2F2ZUJ1dHRvbicsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgndmlzaWJsZUNvbHVtbk51bWJlcicsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnb25CZWZvcmVFZGl0Jywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdvblZhbGlkYXRpb24nLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ29uQWZ0ZXJFZGl0Jywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdvbkJlZm9yZVNhdmUnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ29uQWZ0ZXJTYXZlJywgb3B0aW9ucyk7XG5cblx0aW5pdElubmVyQ2FsY3VsYXRlZFZhbHVlcygpO1xufVxuXG5mdW5jdGlvbiBpbml0SW5uZXJTdGF0aWNWYWx1ZXMoKSB7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyID0ge307XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycyA9IHt9O1xuXG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dUb3AgPSAnYnVmZmVyLXJvdy10b3AnO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tID0gJ2J1ZmZlci1yb3ctYm90dG9tJztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQgPSAnYnVmZmVyLWNvbHVtbi1sZWZ0Jztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0ID0gJ2J1ZmZlci1jb2x1bW4tcmlnaHQnO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93ID0gJ2hlYWRlci1yb3cnO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCA9ICdoZWFkZXItY2VsbCc7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93ID0gJ2RhdGEtcm93Jztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsID0gJ2RhdGEtY2VsbCc7XG5cblx0Ly8gTWluaW11bSBidWZmZXIgY2VsbCBoZWlnaHQuIEF6w6lydCB2YW4gcsOhIHN6w7xrc8OpZywgbWVydCBoYSBuaW5jcyBtZWdhZHZhLCBha2tvciB1Z3JpayBlZ3lldHQgYSBzY3JvbGwgaGEgYSB2w6lnw6lyZSB2YWd5IGF6IGVsZWrDqXJlIMOpcnTDvG5rIGEgdMOhYmzDoXphdGJhblxuXHRjb25maWdJbnN0YW5jZS5pbm5lci5taW5DZWxsSGVpZ2h0ID0gMjtcblxuXHQvLyBBeiBvZmZzZXQgbWlhdHQga2VsbCBhIHN6w6Ftb2zDoXNob3pcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIudGFibGVIZWlnaHRPZmZzZXQgPSBjb25maWdJbnN0YW5jZS5pbm5lci5taW5DZWxsSGVpZ2h0ICogMjtcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuZWRpdGVkQ2VsbHMgPSBbXTtcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIubGVmdENlbGxPZmZzZXQgPSAwO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci50b3BDZWxsT2Zmc2V0ID0gMDtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChvcHRpb25zKSB7XG5cdHZhciBjb250YWluZXJIZWlnaHQgPSBnZXRJbm5lclZhbHVlKG9wdGlvbnMsICdkaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCcpO1xuXG5cdGlmICh0eXBlb2YgY29udGFpbmVySGVpZ2h0ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y29udGFpbmVySGVpZ2h0ID0gY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0KGNvbmZpZ0luc3RhbmNlKTtcblx0fVxuXG5cdHVwZGF0ZVZhbHVlKCdkaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCcsIGNvbmZpZ1V0aWwuY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWdJbnN0YW5jZSwgY29udGFpbmVySGVpZ2h0KSk7XG59XG5cbmZ1bmN0aW9uIGluaXRJbm5lckNhbGN1bGF0ZWRWYWx1ZXMoKSB7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyID0gY29uZmlnVXRpbC5nZXRJbmRleE9mQ2VsbEtleUhlYWRlcihjb25maWdJbnN0YW5jZSk7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmNvbHNwYW5PZmZzZXQgPSBjb25maWdVdGlsLmdldE1heENvbHNwYW4oY29uZmlnSW5zdGFuY2UpO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci52aXNpYmxlUm93TnVtYmVyID0gY29uZmlnVXRpbC5nZXRWaXNpYmxlUm93TnVtYmVyKGNvbmZpZ0luc3RhbmNlKTtcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlciA9IGNvbmZpZ1V0aWwuZ2V0VmlzaWJsZUNvbHVtbk51bWJlcihjb25maWdJbnN0YW5jZSk7XG5cdGNvbmZpZ0luc3RhbmNlLnRhYmxlV2lkdGggPSBjb25maWdVdGlsLmdldFRhYmxlV2lkdGgoY29uZmlnSW5zdGFuY2UpO1xuXHRjb25maWdJbnN0YW5jZS50YWJsZUhlaWdodCA9IGNvbmZpZ1V0aWwuZ2V0VGFibGVIZWlnaHQoY29uZmlnSW5zdGFuY2UpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWYWx1ZShrZXksIG9wdGlvbnMpIHtcblx0dmFyIHRhcmdldCA9IGdldElubmVyT2JqZWN0KGNvbmZpZ0luc3RhbmNlLCBrZXkpLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cdFx0dmFsdWUgPSBnZXRJbm5lclZhbHVlKG9wdGlvbnMsIGtleSksXG5cdFx0a2V5cyA9IGtleS5zcGxpdCgnLicpLFxuXHRcdGxhc3RLZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAndW5kZWZpbmVkJykge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHR5cGVvZiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpID09ICdmdW5jdGlvbicgPyBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpKGNvbmZpZ0luc3RhbmNlKSA6IGdldElubmVyVmFsdWUoREVGQVVMVFMsIGtleSk7XG5cdH0gZWxzZSB7XG5cdFx0dGFyZ2V0W2xhc3RLZXldID0gdmFsdWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0SW5uZXJPYmplY3Qob2JqZWN0LCBrZXkpIHtcblx0aWYgKGtleS5pbmRleE9mKCcuJykgPT09IC0xKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXG5cdHZhciBzdWJLZXkgPSBrZXkuc3BsaXQoJy4nKVswXSxcblx0XHRzdWJPYmplY3QgPSBvYmplY3Rbc3ViS2V5XTtcblxuXHRpZiAodHlwZW9mIHN1Yk9iamVjdCA9PSAndW5kZWZpbmVkJykge1xuXHRcdG9iamVjdFtzdWJLZXldID0ge307XG5cdFx0c3ViT2JqZWN0ID0gb2JqZWN0W3N1YktleV07XG5cdH1cblxuXHRyZXR1cm4gZ2V0SW5uZXJPYmplY3Qoc3ViT2JqZWN0LCBrZXkuc3Vic3RyaW5nKGtleS5pbmRleE9mKCcuJykgKyAxKSk7XG59XG5cbmZ1bmN0aW9uIGdldElubmVyVmFsdWUob2JqZWN0LCBrZXkpIHtcblx0aWYgKGtleS5pbmRleE9mKCcuJykgPT09IC0xKSB7XG5cdFx0cmV0dXJuIG9iamVjdFtrZXldO1xuXHR9XG5cblx0dmFyIHN1YktleSA9IGtleS5zcGxpdCgnLicpWzBdLFxuXHRcdHN1Yk9iamVjdCA9IG9iamVjdFtzdWJLZXldO1xuXG5cdGlmICh0eXBlb2Ygc3ViT2JqZWN0ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0cmV0dXJuIHN1Yk9iamVjdDtcblx0fVxuXG5cdHJldHVybiBnZXRJbm5lclZhbHVlKHN1Yk9iamVjdCwga2V5LnN1YnN0cmluZyhrZXkuaW5kZXhPZignLicpICsgMSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdDogaW5pdCxcblx0dXBkYXRlVmFsdWU6IHVwZGF0ZVZhbHVlXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjEsXCIuLi91dGlscy9jb25maWd1cmF0aW9uXCI6OCxcIi4uL3V0aWxzL2dlbmVyYXRvclwiOjEyfV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25maWd1cmF0aW9uICAgID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uJyksXG5cdGV2ZW50SGFuZGxlclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9ldmVudC1oYW5kbGVyJyksXG5cdGdlbmVyYXRvclV0aWwgICAgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKSxcblx0ZG9tVXRpbCAgICAgICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzL2RvbScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgICA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uJyk7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFibGUoaWQsIG9wdGlvbnMpIHtcblx0Y29uZmlndXJhdGlvbi5pbml0KG9wdGlvbnMpO1xuXG5cdGdlbmVyYXRvclV0aWwuaW5pdFRhYmxlKGNvbmZpZ0luc3RhbmNlKTtcblx0Z2VuZXJhdG9yVXRpbC5pbml0QnVmZmVycyhjb25maWdJbnN0YW5jZSk7XG5cblx0ZG9tVXRpbC51cGRhdGVUYWJsZSgpO1xuXG5cdGV2ZW50SGFuZGxlclV0aWwuYWRkRXZlbnRzKCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZSgpIHtcblx0ZXZlbnRIYW5kbGVyVXRpbC5yZW1vdmVFdmVudHMoKTtcblx0ZG9tVXRpbC5kZXN0cm95VGFibGUoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdlbmVyYXRlVGFibGU6IGdlbmVyYXRlVGFibGUsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjEsXCIuLi91dGlscy9kb21cIjo5LFwiLi4vdXRpbHMvZXZlbnQtaGFuZGxlclwiOjExLFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTIsXCIuL2NvbmZpZ3VyYXRpb25cIjo0fV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmlmICh0eXBlb2YgQXJyYXkucHJvdG90eXBlLmZpbmQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0QXJyYXkucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihwcmVkaWNhdGUpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1leHRlbmQtbmF0aXZlXG5cdFx0aWYgKHRoaXMgPT09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5maW5kIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdwcmVkaWNhdGUgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0dmFyIGxpc3QgPSBPYmplY3QodGhpcyk7XG5cdFx0dmFyIGxlbmd0aCA9IGxpc3QubGVuZ3RoID4+PiAwO1xuXHRcdHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuXHRcdHZhciB2YWx1ZTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhbHVlID0gbGlzdFtpXTtcblx0XHRcdGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCkpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB1bmRlZmluZWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZpbmVkXG5cdH07XG59XG59LHt9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuaWYgKCFOb2RlTGlzdC5wcm90b3R5cGUuZm9yRWFjaCkge1xuXHROb2RlTGlzdC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBhcmd1bWVudCkge1xuXHRcdGFyZ3VtZW50ID0gYXJndW1lbnQgfHwgd2luZG93O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKGFyZ3VtZW50LCB0aGlzW2ldLCBpLCB0aGlzKTtcblx0XHR9XG5cdH07XG59XG59LHt9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChpbnN0YW5jZSwgaGVpZ2h0KSB7XG5cdGlmICh0eXBlb2YgaGVpZ2h0ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0cmV0dXJuIGhlaWdodDtcblx0fVxuXG5cdHJldHVybiBpbnN0YW5jZS5pbm5lci50YWJsZUhlaWdodE9mZnNldCArIE1hdGguZmxvb3IoaGVpZ2h0IC8gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KSAqIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodChpbnN0YW5jZSkge1xuXHRyZXR1cm4gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChpbnN0YW5jZSwgd2luZG93LmlubmVySGVpZ2h0IC0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnN0YW5jZS5zZWxlY3RvcnMubWFpbkNvbnRhaW5lcikuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gNjQpO1xufVxuXG5mdW5jdGlvbiBnZXRJbmRleE9mQ2VsbEtleUhlYWRlcihpbnN0YW5jZSkge1xuXHRyZXR1cm4gaW5zdGFuY2UuaGVhZGVycy5sZW5ndGggLSAxO1xufVxuXG5mdW5jdGlvbiBnZXRNYXhDb2xzcGFuKGluc3RhbmNlKSB7XG5cdHZhciBtYXhWYWwgPSAwO1xuXG5cdGluc3RhbmNlLmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0ZWxlbWVudC5mb3JFYWNoKGZ1bmN0aW9uKHN1YkVsZW1lbnQpIHtcblx0XHRcdGlmICh0eXBlb2Ygc3ViRWxlbWVudC5jb2xzcGFuICE9ICd1bmRlZmluZWQnICYmIG1heFZhbCA8IHN1YkVsZW1lbnQuY29sc3Bhbikge1xuXHRcdFx0XHRtYXhWYWwgPSBzdWJFbGVtZW50LmNvbHNwYW47XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHJldHVybiBtYXhWYWw7XG59XG5cbmZ1bmN0aW9uIGdldFZpc2libGVSb3dOdW1iZXIoaW5zdGFuY2UpIHtcblx0cmV0dXJuIE1hdGguZmxvb3IoKGluc3RhbmNlLmRpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0IC0gaW5zdGFuY2UuaW5uZXIudGFibGVIZWlnaHRPZmZzZXQpIC8gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KSAtIGluc3RhbmNlLmhlYWRlcnMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlQ29sdW1uTnVtYmVyKGluc3RhbmNlKSB7XG5cdHJldHVybiBNYXRoLmZsb29yKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLm9mZnNldFdpZHRoIC8gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGggK1xuXHRcdChpbnN0YW5jZS5pbm5lci5jb2xzcGFuT2Zmc2V0ID4gMiA/IGluc3RhbmNlLmlubmVyLmNvbHNwYW5PZmZzZXQgOiAyKSArIGluc3RhbmNlLmlubmVyLmNvbHNwYW5PZmZzZXQpO1xufVxuXG5mdW5jdGlvbiBnZXRUYWJsZVdpZHRoKGluc3RhbmNlKSB7XG5cdHJldHVybiAoaW5zdGFuY2UuaGVhZGVyc1tpbnN0YW5jZS5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl0ubGVuZ3RoIC0gaW5zdGFuY2UuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcikgKiBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aDtcbn1cblxuZnVuY3Rpb24gZ2V0VGFibGVIZWlnaHQoaW5zdGFuY2UpIHtcblx0cmV0dXJuIChpbnN0YW5jZS5kYXRhU291cmNlLmxlbmd0aCAtIGluc3RhbmNlLmlubmVyLnZpc2libGVSb3dOdW1iZXIgKyAxKSAqIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gbmlsKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQ6IGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQsXG5cdGdldERlZmF1bHRDb250YWluZXJIZWlnaHQ6IGdldERlZmF1bHRDb250YWluZXJIZWlnaHQsXG5cdGdldEluZGV4T2ZDZWxsS2V5SGVhZGVyOiBnZXRJbmRleE9mQ2VsbEtleUhlYWRlcixcblx0Z2V0TWF4Q29sc3BhbjogZ2V0TWF4Q29sc3Bhbixcblx0Z2V0VmlzaWJsZVJvd051bWJlcjogZ2V0VmlzaWJsZVJvd051bWJlcixcblx0Z2V0VmlzaWJsZUNvbHVtbk51bWJlcjogZ2V0VmlzaWJsZUNvbHVtbk51bWJlcixcblx0Z2V0VGFibGVXaWR0aDogZ2V0VGFibGVXaWR0aCxcblx0Z2V0VGFibGVIZWlnaHQ6IGdldFRhYmxlSGVpZ2h0LFxuXHRuaWw6IG5pbFxufTtcbn0se31dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBpbmRleE9mRWxlbWVudChlbGVtZW50KSB7XG5cdHZhciBjb2xsZWN0aW9uID0gZWxlbWVudC5wYXJlbnROb2RlLmNoaWxkTm9kZXM7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKGNvbGxlY3Rpb25baV0gPT09IGVsZW1lbnQpIHtcblx0XHRcdHJldHVybiBpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2VsbChjZWxsLCBjZWxsT2JqKSB7XG5cdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai52YWx1ZTtcblx0Y2VsbC5jbGFzc05hbWUgPSBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwgKyAnICcgKyAoY2VsbE9iai5jbGFzcyB8fCAnJyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVRhYmxlKCkge1xuXHR2YXIgY291bnRSb3cgPSAwLFxuXHRcdGNvbHNwYW4gPSAxO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpLmZvckVhY2goZnVuY3Rpb24ocm93KSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR2YXIgY2VsbE9iaiA9IGNvbmZpZ0luc3RhbmNlLmhlYWRlcnNbY291bnRSb3ddW2NvbmZpZ0luc3RhbmNlLmlubmVyLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcl07XG5cblx0XHRcdGlmIChjb2xzcGFuID4gMSkge1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGNvbHNwYW4tLTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai50ZXh0IHx8IGNlbGxPYmoua2V5IHx8ICcnO1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAndGFibGUtY2VsbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgY2VsbE9iai5jb2xzcGFuID09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNlbGwucmVtb3ZlQXR0cmlidXRlKCdjb2xzcGFuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2FsY3VsYXRlZENvbHNwYW4gPSBjb25maWdJbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyIDw9IGNlbGxOdW1iZXIgKyBjZWxsT2JqLmNvbHNwYW4gPyBjb25maWdJbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyIC0gY2VsbE51bWJlciA6IGNlbGxPYmouY29sc3BhbjtcblxuXHRcdFx0XHRjZWxsLnNldEF0dHJpYnV0ZSgnY29sc3BhbicsIGNhbGN1bGF0ZWRDb2xzcGFuKTtcblx0XHRcdFx0Y29sc3BhbiA9IGNhbGN1bGF0ZWRDb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGNvdW50Um93Kys7XG5cdFx0Y29sc3BhbiA9IDE7XG5cdH0pO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWdJbnN0YW5jZS5pbm5lci50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjb25maWdJbnN0YW5jZS5pbm5lci5sZWZ0Q2VsbE9mZnNldCArIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Rml4ZWRDZWxsKGNvbmZpZ0luc3RhbmNlLmlubmVyLnRvcENlbGxPZmZzZXQgKyByb3dOdW1iZXIsIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0RWRpdGluZ0NlbGwob25JbnB1dEJsdXJFdmVudEhhbmRsZXIpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLmVkaXRpbmdDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGVkaXRpbmdDZWxsKSB7XG5cdFx0dmFyIGlucHV0ID0gZWRpdGluZ0NlbGwucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcblxuXHRcdGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdFx0ZWRpdGluZ0NlbGwuaW5uZXJIVE1MID0gaW5wdXQudmFsdWU7XG5cdFx0ZWRpdGluZ0NlbGwuY2xhc3NMaXN0LnJlbW92ZShjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRFZGl0ZWRDZWxsKCkge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpLmZvckVhY2goZnVuY3Rpb24oZWRpdGVkQ2VsbCkge1xuXHRcdGVkaXRlZENlbGwuY2xhc3NMaXN0LnJlbW92ZShjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzID0gW107XG5cdHVwZGF0ZVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZSgpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMubWFpbkNvbnRhaW5lcikuaW5uZXJIVE1MID0gJyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbmRleE9mRWxlbWVudDogaW5kZXhPZkVsZW1lbnQsXG5cdHVwZGF0ZUNlbGw6IHVwZGF0ZUNlbGwsXG5cdHVwZGF0ZVRhYmxlOiB1cGRhdGVUYWJsZSxcblx0cmVzZXRFZGl0aW5nQ2VsbDogcmVzZXRFZGl0aW5nQ2VsbCxcblx0cmVzZXRFZGl0ZWRDZWxsOiByZXNldEVkaXRlZENlbGwsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjEsXCIuL3RhYmxlXCI6MTN9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEFyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL21vZGVscy9ldmVudC1hcmd1bWVudHMnKSxcblx0dGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpLFxuXHRkb21VdGlsICAgPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBzYXZlQ2VsbHMoKSB7XG5cdGlmICghY29uZmlnSW5zdGFuY2UuZWRpdC5lbmFibGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGFyZ3MgPSBuZXcgRXZlbnRBcmd1bWVudHMoe1xuXHRcdGNlbGxPYmplY3Q6IGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWdJbnN0YW5jZS5ldmVudEhhbmRsZXJzLm9uQmVmb3JlU2F2ZShhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHRjb25maWdJbnN0YW5jZS5pbm5lci5lZGl0ZWRDZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdHRhYmxlVXRpbC5zZXRDZWxsVmFsdWUoY2VsbC5yb3dOdW1iZXIsIGNlbGwuY29sdW1uTnVtYmVyLCBjZWxsLnZhbHVlKTtcblx0XHR9KTtcblx0XHRkb21VdGlsLnJlc2V0RWRpdGVkQ2VsbCgpO1xuXG5cdFx0Y29uZmlnSW5zdGFuY2UuZXZlbnRIYW5kbGVycy5vbkFmdGVyU2F2ZShhcmdzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2F2ZUNlbGxzOiBzYXZlQ2VsbHNcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjozLFwiLi9kb21cIjo5LFwiLi90YWJsZVwiOjEzfV0sMTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzJyk7XG5cbnZhciBkb21VdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZG9tJyksXG5cdHRhYmxlVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL3RhYmxlJyksXG5cdGVkaXRVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZWRpdCcpLFxuXHRnZW5lcmF0b3JVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2VuZXJhdG9yJyk7XG5cbnZhciBjb25maWdJbnN0YW5jZSA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uJyk7XG5cbnZhciBjb250YWluZXI7XG5cbmZ1bmN0aW9uIG9uV2hlZWxFdmVudEhhbmRsZXIoZXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRjb250YWluZXIuc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWTtcblx0Y29udGFpbmVyLnNjcm9sbExlZnQgKz0gZXZlbnQuZGVsdGFYO1xufVxuXG5mdW5jdGlvbiBvblNjcm9sbEV2ZW50SGFuZGxlcigpIHtcblx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0Z2VuZXJhdG9yVXRpbC5pbml0QnVmZmVycyhjb25maWdJbnN0YW5jZSk7XG5cdGRvbVV0aWwudXBkYXRlVGFibGUoKTtcbn1cblxuZnVuY3Rpb24gb25JbnB1dEJsdXJFdmVudEhhbmRsZXIoKSB7XG5cdHZhciBjZWxsID0gdGhpcy5wYXJlbnROb2RlLFxuXHRcdHJvd051bWJlciA9IGRvbVV0aWwuaW5kZXhPZkVsZW1lbnQoY2VsbC5wYXJlbnROb2RlKSArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnRvcENlbGxPZmZzZXQsXG5cdFx0Y29sdW1uTnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChjZWxsKSAtIDEgKyBjb25maWdJbnN0YW5jZS5pbm5lci5sZWZ0Q2VsbE9mZnNldCxcblx0XHRlZGl0ZWRPYmogPSB0YWJsZVV0aWwuZ2V0Q2VsbChyb3dOdW1iZXIsIGNvbHVtbk51bWJlcik7XG5cblx0ZWRpdGVkT2JqLnVwZGF0ZUF0dHJpYnV0ZXMoe1xuXHRcdHZhbHVlOiB0aGlzLnZhbHVlLFxuXHRcdGNsYXNzOiBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGVkQ2VsbFxuXHR9KTtcblxuXHRpZiAoIXRhYmxlVXRpbC5pc0NlbGxDaGFuZ2VkKGVkaXRlZE9iaikpIHtcblx0XHRkb21VdGlsLnJlc2V0RWRpdGluZ0NlbGwob25JbnB1dEJsdXJFdmVudEhhbmRsZXIpO1xuXG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGFyZ3MgPSBuZXcgRXZlbnRBcmd1bWVudHMoe1xuXHRcdGNlbGw6IGNlbGwsXG5cdFx0Y2VsbE9iamVjdDogZWRpdGVkT2JqLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWdJbnN0YW5jZS5ldmVudEhhbmRsZXJzLm9uVmFsaWRhdGlvbihhcmdzKTtcblxuXHRpZiAoYXJncy5jYW5jZWxFZGl0ICE9PSB0cnVlKSB7XG5cdFx0dGFibGVVdGlsLnNldFVwZGF0ZWRDZWxsVmFsdWUoYXJncy5jZWxsT2JqZWN0KTtcblx0XHRkb21VdGlsLnVwZGF0ZUNlbGwoYXJncy5jZWxsLCBhcmdzLmNlbGxPYmplY3QpO1xuXG5cdFx0Y29uZmlnSW5zdGFuY2UuZXZlbnRIYW5kbGVycy5vbkFmdGVyRWRpdChhcmdzKTtcblx0fVxufVxuXG5mdW5jdGlvbiBvbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcigpIHtcblx0aWYgKCFjb25maWdJbnN0YW5jZS5lZGl0LmVuYWJsZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgcm93TnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudCh0aGlzLnBhcmVudE5vZGUpICsgY29uZmlnSW5zdGFuY2UuaW5uZXIudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KHRoaXMpIC0gMSArIGNvbmZpZ0luc3RhbmNlLmlubmVyLmxlZnRDZWxsT2Zmc2V0LFxuXHRcdGVkaXRlZE9iaiA9IHRhYmxlVXRpbC5nZXRDZWxsKHJvd051bWJlciwgY29sdW1uTnVtYmVyKSxcblx0XHRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0aW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbDogdGhpcyxcblx0XHRjZWxsT2JqZWN0OiBlZGl0ZWRPYmosXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLmV2ZW50SGFuZGxlcnMub25CZWZvcmVFZGl0KGFyZ3MpO1xuXG5cdGlmICghYXJncy5jYW5jZWxFdmVudCkge1xuXHRcdHRoaXMuY2xhc3NMaXN0LmFkZChjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHRcdHRoaXMuY2xhc3NMaXN0LnJlbW92ZShjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdFx0dGhpcy5pbm5lckhUTUwgPSAnJztcblx0XHR0aGlzLmFwcGVuZENoaWxkKGlucHV0KTtcblxuXHRcdGlucHV0LmZvY3VzKCk7XG5cdFx0aW5wdXQudmFsdWUgPSBlZGl0ZWRPYmoudmFsdWU7XG5cdFx0aW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRFdmVudHMoKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpO1xuXG5cdGlmIChjb250YWluZXIgIT09IG51bGwpIHtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBvbldoZWVsRXZlbnRIYW5kbGVyLCB7IHBhc3NpdmU6IGZhbHNlLCBjYXB0dXJlOiB0cnVlIH0pO1xuXHRcdGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBvblNjcm9sbEV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRpZiAoY29uZmlnSW5zdGFuY2UuZWRpdC5lbmFibGVkICYmIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy5zYXZlQnV0dG9uICE9PSBudWxsKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuc2F2ZUJ1dHRvbikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlZGl0VXRpbC5zYXZlQ2VsbHMpO1xuXHR9XG5cblx0aWYgKGNvbmZpZ0luc3RhbmNlLmVkaXQuZW5hYmxlZCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdGQuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcik7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRzKCkge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBvblNjcm9sbEV2ZW50SGFuZGxlcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRvbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcjogb25DbGlja0NlbGxFdmVudEhhbmRsZXIsXG5cdGFkZEV2ZW50czogYWRkRXZlbnRzLFxuXHRyZW1vdmVFdmVudHM6IHJlbW92ZUV2ZW50c1xufTtcbn0se1wiLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb25cIjoxLFwiLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50c1wiOjMsXCIuLi91dGlscy9kb21cIjo5LFwiLi4vdXRpbHMvZWRpdFwiOjEwLFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTIsXCIuLi91dGlscy90YWJsZVwiOjEzfV0sMTI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbml0Q29udGFpbmVycyhpbnN0YW5jZSkge1xuXHR2YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpbnN0YW5jZS5zZWxlY3RvcnMubWFpbkNvbnRhaW5lciksXG5cdFx0dmlydHVhbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdHZpcnR1YWxUYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyksXG5cdFx0Zml4ZWRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRmaXhlZFRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKTtcblxuXHR2aXJ0dWFsQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsVGFibGUuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbFRhYmxlKTtcblx0Zml4ZWRDb250YWluZXIuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRDb250YWluZXIpO1xuXHRmaXhlZFRhYmxlLmNsYXNzTGlzdC5hZGQoaW5zdGFuY2Uuc2VsZWN0b3JzLmZpeGVkVGFibGUpO1xuXG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZChmaXhlZENvbnRhaW5lcik7XG5cdGZpeGVkQ29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkVGFibGUpO1xuXG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCh2aXJ0dWFsQ29udGFpbmVyKTtcblx0dmlydHVhbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2aXJ0dWFsVGFibGUpO1xuXG5cdHZpcnR1YWxDb250YWluZXIuc3R5bGUubWF4SGVpZ2h0ID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQgKyAncHgnO1xuXHR2aXJ0dWFsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cblx0Zml4ZWRDb250YWluZXIuc3R5bGUucGFkZGluZyA9IGluc3RhbmNlLmlubmVyLm1pbkNlbGxIZWlnaHQgKyAncHggMCc7XG5cdGZpeGVkQ29udGFpbmVyLnN0eWxlLmZsb2F0ID0gJ2xlZnQnO1xufVxuXG5mdW5jdGlvbiBpbml0VGFibGUoaW5zdGFuY2UpIHtcblx0Ly8gR2VuZXJhdGUgdmlydHVhbCB0YWJsZVxuXHR2YXIgdmlydHVhbFRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKSxcblx0XHR2aXJ0dWFsVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpLFxuXHRcdHRySGVhZEJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cblx0dHJIZWFkQnVmZmVyLmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblxuXHR2YXIgaSwgaiwgdHJIZWFkLCB0ckJvZHksIGJ1ZmZlckNvbHVtbkxlZnQsIGJ1ZmZlckNvbHVtblJpZ2h0LCBidWZmZXJSb3dCb3R0b20sIHRkRWxlbWVudDtcblxuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIGhlYWRlclxuXHRidWZmZXJDb2x1bW5MZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0YnVmZmVyQ29sdW1uTGVmdC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0KTtcblxuXHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQoYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0Zm9yIChpID0gMDsgaSA8IGluc3RhbmNlLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXI7IGkrKykge1xuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXHRcdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHR9XG5cblx0YnVmZmVyQ29sdW1uUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5SaWdodC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5SaWdodCk7XG5cblx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKGJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHR2aXJ0dWFsVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkQnVmZmVyKTtcblxuXHRpbnN0YW5jZS5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyUm93KSB7XG5cdFx0dHJIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckhlYWQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93KTtcblx0XHR0ckhlYWQuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXG5cdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgaW5zdGFuY2UuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXHRcdFx0dGRFbGVtZW50LmlubmVySFRNTCA9IGhlYWRlclJvd1tqXS50ZXh0IHx8IGhlYWRlclJvd1tqXS5rZXkgfHwgJyc7XG5cblx0XHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH0pO1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgYm9keVxuXHRmb3IgKGkgPSAwOyBpIDwgaW5zdGFuY2UuaW5uZXIudmlzaWJsZVJvd051bWJlcjsgaSsrKSB7XG5cdFx0dHJCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckJvZHkuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdyk7XG5cdFx0dHJCb2R5LnN0eWxlLmhlaWdodCA9IGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0KTtcblxuXHRcdHRyQm9keS5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGluc3RhbmNlLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXI7IGorKykge1xuXHRcdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cblx0XHRcdHRyQm9keS5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHRcdHRyQm9keS5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0dmlydHVhbFRib2R5LmFwcGVuZENoaWxkKHRyQm9keSk7XG5cdH1cblxuXHRidWZmZXJSb3dCb3R0b20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRidWZmZXJSb3dCb3R0b20uY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tKTtcblxuXHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQoYnVmZmVyUm93Qm90dG9tKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUpLmFwcGVuZENoaWxkKHZpcnR1YWxUaGVhZCk7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSkuYXBwZW5kQ2hpbGQodmlydHVhbFRib2R5KTtcblxuXHRpbnN0YW5jZS5pbm5lci5idWZmZXJMZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlclJpZ2h0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXHRpbnN0YW5jZS5pbm5lci5idWZmZXJUb3AgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dUb3BDbGFzcyk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlckJvdHRvbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd0JvdHRvbSk7XG5cblx0Ly8gR2VuZXJhdGUgZml4ZWQgdGFibGVcblxuXHRpZiAoaW5zdGFuY2UuZml4ZWRIZWFkZXJzLmxlbmd0aCA9PT0gMCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBmaXhlZFRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKSxcblx0XHRmaXhlZFRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGJvZHknKTtcblxuXHQvLyBHZW5lcmF0ZSBmaXhlZCBoZWFkZXJcblxuXHRmb3IgKGkgPSAwOyBpIDwgaW5zdGFuY2UuZml4ZWRIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHJIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckhlYWQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93KTtcblx0XHR0ckhlYWQuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdGZvciAoaiA9IDA7IGogPCBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0XHR0ZEVsZW1lbnQuaW5uZXJIVE1MID0gaW5zdGFuY2UuZml4ZWRIZWFkZXJzW2ldW2pdLnRleHQgfHwgaW5zdGFuY2UuZml4ZWRIZWFkZXJzW2ldW2pdLmtleSB8fCAnJztcblxuXHRcdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Zml4ZWRUaGVhZC5hcHBlbmRDaGlsZCh0ckhlYWQpO1xuXHR9XG5cblx0Ly8gR2VuZXJhdGUgZml4ZWQgYm9keVxuXG5cdGZvciAoaSA9IDA7IGkgPCBpbnN0YW5jZS5pbm5lci52aXNpYmxlUm93TnVtYmVyOyBpKyspIHtcblx0XHR0ckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRyQm9keS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdGZvciAoaiA9IDA7IGogPCBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaW5zdGFuY2UuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKTtcblx0XHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4JztcblxuXHRcdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Zml4ZWRUYm9keS5hcHBlbmRDaGlsZCh0ckJvZHkpO1xuXHR9XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRUYWJsZSkuYXBwZW5kQ2hpbGQoZml4ZWRUaGVhZCk7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLmZpeGVkVGFibGUpLmFwcGVuZENoaWxkKGZpeGVkVGJvZHkpO1xufVxuXG5mdW5jdGlvbiBpbml0QnVmZmVycyhpbnN0YW5jZSkge1xuXHR2YXIgbGVmdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbExlZnQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5zY3JvbGxMZWZ0ICUgaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGggLSBpbnN0YW5jZS5pbm5lci5jb2xzcGFuT2Zmc2V0ICogaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGgsXG5cdFx0cmlnaHQgPSBpbnN0YW5jZS50YWJsZVdpZHRoIC0gbGVmdCxcblx0XHR0b3AgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5zY3JvbGxUb3AsXG5cdFx0Ym90dG9tID0gaW5zdGFuY2UudGFibGVIZWlnaHQgLSB0b3A7XG5cblx0bGVmdCA9IGxlZnQgPiBpbnN0YW5jZS50YWJsZVdpZHRoID8gaW5zdGFuY2UudGFibGVXaWR0aCA6IGxlZnQ7XG5cdGxlZnQgPSBsZWZ0IDwgMCA/IDAgOiBsZWZ0O1xuXHRyaWdodCA9IGluc3RhbmNlLnRhYmxlV2lkdGggLSBsZWZ0O1xuXHR0b3AgPSB0b3AgKyBpbnN0YW5jZS5pbm5lci5taW5DZWxsSGVpZ2h0ID4gaW5zdGFuY2UudGFibGVIZWlnaHQgPyBpbnN0YW5jZS50YWJsZUhlaWdodCArIGluc3RhbmNlLmlubmVyLm1pbkNlbGxIZWlnaHQgOiB0b3AgKyBpbnN0YW5jZS5pbm5lci5taW5DZWxsSGVpZ2h0O1xuXHRib3R0b20gPSBpbnN0YW5jZS50YWJsZUhlaWdodCAtIHRvcDtcblxuXHRpbnN0YW5jZS5pbm5lci5sZWZ0Q2VsbE9mZnNldCA9IE1hdGguZmxvb3IobGVmdCAvIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbFdpZHRoKTtcblx0aW5zdGFuY2UuaW5uZXIudG9wQ2VsbE9mZnNldCA9IE1hdGguZmxvb3IoKHRvcCAtIHRvcCAlIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbEhlaWdodCkgLyBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQpO1xuXG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlckxlZnQuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGVsLnN0eWxlLm1pbldpZHRoID0gbGVmdCArICdweCc7XG5cdH0pO1xuXHRpbnN0YW5jZS5pbm5lci5idWZmZXJSaWdodC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSByaWdodCArICdweCc7XG5cdH0pO1xuXHRpbnN0YW5jZS5pbm5lci5idWZmZXJUb3AuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGVsLnN0eWxlLmhlaWdodCA9IHRvcCArICdweCc7XG5cdH0pO1xuXHRpbnN0YW5jZS5pbm5lci5idWZmZXJCb3R0b20uZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGVsLnN0eWxlLmhlaWdodCA9IGJvdHRvbSArICdweCc7XG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdFRhYmxlOiBpbml0VGFibGUsXG5cdGluaXRDb250YWluZXJzOiBpbml0Q29udGFpbmVycyxcblx0aW5pdEJ1ZmZlcnM6IGluaXRCdWZmZXJzXG59O1xufSx7fV0sMTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ2VsbCA9IHJlcXVpcmUoJy4uL21vZGVscy9jZWxsJyk7XG5cbnZhciBjb25maWdJbnN0YW5jZSA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uJyk7XG5cbmZ1bmN0aW9uIGdldENlbGwocm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpIHtcblx0dmFyIGNlbGxPYmogPSBjb25maWdJbnN0YW5jZS5pbm5lci5lZGl0ZWRDZWxscy5maW5kKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRyZXR1cm4gZWwucm93TnVtYmVyID09PSByb3dOdW1iZXIgJiYgZWwuY29sdW1uTnVtYmVyID09PSBjb2x1bW5OdW1iZXI7XG5cdFx0fSksXG5cdFx0cm93T2JqID0gY29uZmlnSW5zdGFuY2UuaGVhZGVyc1tjb25maWdJbnN0YW5jZS5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl07XG5cblx0aWYgKHR5cGVvZiBjZWxsT2JqID09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y2VsbE9iaiA9IG5ldyBDZWxsKHtcblx0XHRcdGtleTogcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5LFxuXHRcdFx0dmFsdWU6IGNvbmZpZ0luc3RhbmNlLmRhdGFTb3VyY2Vbcm93TnVtYmVyXVtyb3dPYmpbY29sdW1uTnVtYmVyXS5rZXldXG5cdFx0fSk7XG5cblx0XHRjZWxsT2JqLnVwZGF0ZUF0dHJpYnV0ZXMoe1xuXHRcdFx0cm93TnVtYmVyOiByb3dOdW1iZXIsXG5cdFx0XHRjb2x1bW5OdW1iZXI6IGNvbHVtbk51bWJlclxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIGNlbGxPYmo7XG59XG5cbmZ1bmN0aW9uIGdldEZpeGVkQ2VsbChyb3dOdW1iZXIsIGNvbHVtbk51bWJlcikge1xuXHR2YXIgY2VsbE9iaiA9IG51bGwsXG5cdFx0cm93T2JqID0gY29uZmlnSW5zdGFuY2UuZml4ZWRIZWFkZXJzW2NvbmZpZ0luc3RhbmNlLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjZWxsT2JqID0gbmV3IENlbGwoe1xuXHRcdGtleTogcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5LFxuXHRcdHZhbHVlOiBjb25maWdJbnN0YW5jZS5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XVxuXHR9KTtcblxuXHRyZXR1cm4gY2VsbE9iajtcbn1cblxuZnVuY3Rpb24gc2V0Q2VsbFZhbHVlKHJvd051bWJlciwgY29sdW1uTnVtYmVyLCB2YWx1ZSkge1xuXHR2YXIgcm93T2JqID0gY29uZmlnSW5zdGFuY2UuaGVhZGVyc1tjb25maWdJbnN0YW5jZS5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl07XG5cblx0Y29uZmlnSW5zdGFuY2UuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNDZWxsQ2hhbmdlZChjZWxsT2JqKSB7XG5cdHZhciBvcmlnaW5hbE9iaiA9IGdldENlbGwoY2VsbE9iai5yb3dOdW1iZXIsIGNlbGxPYmouY29sdW1uTnVtYmVyKSxcblx0XHRlZGl0ZWRPYmogPSBjb25maWdJbnN0YW5jZS5pbm5lci5lZGl0ZWRDZWxscy5maW5kKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRyZXR1cm4gZWwucm93TnVtYmVyID09PSBjZWxsT2JqLnJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNlbGxPYmouY29sdW1uTnVtYmVyO1xuXHRcdH0pLFxuXHRcdG9yaWdpbmFsVmFsID0gb3JpZ2luYWxPYmoudmFsdWUgfHwgJyc7XG5cblx0cmV0dXJuIG9yaWdpbmFsVmFsICE9PSBjZWxsT2JqLnZhbHVlIHx8IHR5cGVvZiBlZGl0ZWRPYmogIT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIHNldFVwZGF0ZWRDZWxsVmFsdWUoY2VsbE9iaikge1xuXHR2YXIgcHJldiA9IGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRyZXR1cm4gZWwucm93TnVtYmVyID09PSBjZWxsT2JqLnJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNlbGxPYmouY29sdW1uTnVtYmVyO1xuXHR9KTtcblxuXHRpZiAodHlwZW9mIHByZXYgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRjb25maWdJbnN0YW5jZS5pbm5lci5lZGl0ZWRDZWxscy5wdXNoKGNlbGxPYmopO1xuXHR9IGVsc2Uge1xuXHRcdHByZXYudmFsdWUgPSBjZWxsT2JqLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRDZWxsOiBnZXRDZWxsLFxuXHRnZXRGaXhlZENlbGw6IGdldEZpeGVkQ2VsbCxcblx0c2V0Q2VsbFZhbHVlOiBzZXRDZWxsVmFsdWUsXG5cdGlzQ2VsbENoYW5nZWQ6IGlzQ2VsbENoYW5nZWQsXG5cdHNldFVwZGF0ZWRDZWxsVmFsdWU6IHNldFVwZGF0ZWRDZWxsVmFsdWVcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL21vZGVscy9jZWxsXCI6Mn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxucmVxdWlyZSgnLi9wb2xseWZpbGxzL0FycmF5LmZpbmQuanMnKTtyZXF1aXJlKCcuL3BvbGx5ZmlsbHMvTm9kZUxpc3QuZm9yRWFjaC5qcycpO1xuXG52YXIgZ2VuZXJhdG9yID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dlbmVyYXRvcicpO1xuXG52YXIgdW5pcXVlSWRTZXF1ZW5jZSA9IDE7XG5cbndpbmRvdy5WaXJ0dWFsRGF0YUdyaWQgPSBmdW5jdGlvbigpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYudW5pcXVlSWQgPSB1bmlxdWVJZFNlcXVlbmNlKys7XG5cdHNlbGYuZ2VuZXJhdGVUYWJsZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRnZW5lcmF0b3IuZ2VuZXJhdGVUYWJsZShzZWxmLnVuaXF1ZUlkLCBvcHRpb25zKTtcblx0fTtcblx0c2VsZi5kZXN0cm95VGFibGUgPSBnZW5lcmF0b3IuZGVzdHJveVRhYmxlO1xuXHRzZWxmLmdldElkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlbGYudW5pcXVlSWQ7XG5cdH07XG59O1xufSx7XCIuL21vZHVsZXMvZ2VuZXJhdG9yXCI6NSxcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NixcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6N31dfSx7fSxbMTRdKTtcbiJdLCJmaWxlIjoidmlydHVhbC1kYXRhLWdyaWQuanMifQ==
