(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('./pollyfills/Array.find.js');require('./pollyfills/NodeList.forEach.js');

var generator = require('./modules/generator');

var uniqueIdSequence = 1;

function VirtualDataGrid() {
	var self = this;

	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.uniqueId, options);
	};
	self.destroyTable = generator.destroyTable;
	self.getId = function() {
		return self.uniqueId;
	};
}

window.VirtualDataGrid = VirtualDataGrid;
},{"./modules/generator":6,"./pollyfills/Array.find.js":7,"./pollyfills/NodeList.forEach.js":8}],2:[function(require,module,exports){
'use strict';

var configuration = {};

module.exports = configuration;
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{"../instances/configuration":2,"../utils/configuration":9,"../utils/generator":13}],6:[function(require,module,exports){
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
},{"../instances/configuration":2,"../utils/dom":10,"../utils/event-handler":12,"../utils/generator":13,"./configuration":5}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
'use strict';

if (!NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function(callback, argument) {
		argument = argument || window;

		for (var i = 0; i < this.length; i++) {
			callback.call(argument, this[i], i, this);
		}
	};
}
},{}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{"../instances/configuration":2,"./table":14}],11:[function(require,module,exports){
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
},{"../instances/configuration":2,"../models/event-arguments":4,"./dom":10,"./table":14}],12:[function(require,module,exports){
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
},{"../instances/configuration":2,"../models/event-arguments":4,"../utils/dom":10,"../utils/edit":11,"../utils/generator":13,"../utils/table":14}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{"../instances/configuration":2,"../models/cell":3}]},{},[1]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJy4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzJyk7cmVxdWlyZSgnLi9wb2xseWZpbGxzL05vZGVMaXN0LmZvckVhY2guanMnKTtcblxudmFyIGdlbmVyYXRvciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9nZW5lcmF0b3InKTtcblxudmFyIHVuaXF1ZUlkU2VxdWVuY2UgPSAxO1xuXG5mdW5jdGlvbiBWaXJ0dWFsRGF0YUdyaWQoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnVuaXF1ZUlkID0gdW5pcXVlSWRTZXF1ZW5jZSsrO1xuXHRzZWxmLmdlbmVyYXRlVGFibGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0Z2VuZXJhdG9yLmdlbmVyYXRlVGFibGUoc2VsZi51bmlxdWVJZCwgb3B0aW9ucyk7XG5cdH07XG5cdHNlbGYuZGVzdHJveVRhYmxlID0gZ2VuZXJhdG9yLmRlc3Ryb3lUYWJsZTtcblx0c2VsZi5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzZWxmLnVuaXF1ZUlkO1xuXHR9O1xufVxuXG53aW5kb3cuVmlydHVhbERhdGFHcmlkID0gVmlydHVhbERhdGFHcmlkO1xufSx7XCIuL21vZHVsZXMvZ2VuZXJhdG9yXCI6NixcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NyxcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6OH1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uZmlndXJhdGlvbiA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpZ3VyYXRpb247XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gQ2VsbE9iamVjdChwKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRpbml0QXR0cigna2V5Jyk7XG5cdGluaXRBdHRyKCd2YWx1ZScpO1xuXHRpbml0QXR0cignY2xhc3MnKTtcblx0aW5pdEF0dHIoJ3Jvd051bWJlcicpO1xuXHRpbml0QXR0cignY29sdW1uTnVtYmVyJyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDZWxsT2JqZWN0O1xufSx7fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIEV2ZW50QXJndW1lbnRzKHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdjZWxsJyk7XG5cdGluaXRBdHRyKCdjZWxsT2JqZWN0Jyk7XG5cdGluaXRBdHRyKCdjYW5jZWxFdmVudCcpO1xuXG5cdGZ1bmN0aW9uIGluaXRBdHRyKG5hbWUpIHtcblx0XHRzZWxmW25hbWVdID0gdHlwZW9mIHAgPT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHBbbmFtZV0gPT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcFtuYW1lXTtcblx0fVxuXG5cdHRoaXMudXBkYXRlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzKSB7XG5cdFx0T2JqZWN0LmtleXMoYXR0cnMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuXHRcdFx0aWYgKHR5cGVvZiBhdHRyc1trXSAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygc2VsZltrXSAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRzZWxmW2tdID0gYXR0cnNba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRBcmd1bWVudHM7XG59LHt9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ0luc3RhbmNlID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb24nKTtcblxudmFyIGNvbmZpZ1V0aWwgPSByZXF1aXJlKCcuLi91dGlscy9jb25maWd1cmF0aW9uJyksXG5cdGdlbmVyYXRvclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKTtcblxudmFyIERFRkFVTFRTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRtYWluQ29udGFpbmVyOiAnLmRhdGEtY29udGFpbmVyJyxcblx0XHRmaXhlZENvbnRhaW5lcjogJ2ZpeGVkLWNvbnRhaW5lcicsXG5cdFx0Zml4ZWRUYWJsZTogJ2ZpeGVkLXRhYmxlJyxcblx0XHR2aXJ0dWFsQ29udGFpbmVyOiAndmlydHVhbC1jb250YWluZXInLFxuXHRcdHZpcnR1YWxUYWJsZTogJ3ZpcnR1YWwtdGFibGUnLFxuXHRcdGVkaXRpbmdDZWxsOiAnZWRpdGluZy1jZWxsJyxcblx0XHRlZGl0ZWRDZWxsOiAnZWRpdGVkLWNlbGwnLFxuXHRcdHNhdmVCdXR0b246ICdidG4tc2F2ZSdcblx0fSxcblx0ZGltZW5zaW9uczoge1xuXHRcdGNlbGxXaWR0aDogMTUwLFxuXHRcdGNlbGxIZWlnaHQ6IDUwLFxuXHRcdGNvbnRhaW5lckhlaWdodDogY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHR9LFxuXHRlZGl0OiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0ZXZlbnRIYW5kbGVyczoge1xuXHRcdG9uQmVmb3JlRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25WYWxpZGF0aW9uOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25CZWZvcmVTYXZlOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyU2F2ZTogY29uZmlnVXRpbC5uaWxcblx0fSxcblx0ZGF0YVNvdXJjZTogWyB7fSBdLFxuXHRoZWFkZXJzOiBbIFsge30gXSBdLFxuXHRmaXhlZEhlYWRlcnM6IFsgWyB7fSBdIF0sXG5cdGlubmVyOiB7fVxufTtcblxuZnVuY3Rpb24gaW5pdChvcHRpb25zKSB7XG5cdGluaXRJbm5lclN0YXRpY1ZhbHVlcygpO1xuXG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMubWFpbkNvbnRhaW5lcicsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLmZpeGVkQ29udGFpbmVyJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdzZWxlY3RvcnMuZml4ZWRUYWJsZScsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXInLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ3NlbGVjdG9ycy52aXJ0dWFsVGFibGUnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ3NlbGVjdG9ycy5lZGl0aW5nQ2VsbCcsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLmVkaXRlZENlbGwnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ2RpbWVuc2lvbnMuY2VsbFdpZHRoJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdkaW1lbnNpb25zLmNlbGxIZWlnaHQnLCBvcHRpb25zKTtcblxuXHRjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KG9wdGlvbnMpO1xuXG5cdGdlbmVyYXRvclV0aWwuaW5pdENvbnRhaW5lcnMoY29uZmlnSW5zdGFuY2UpO1xuXG5cdHVwZGF0ZVZhbHVlKCdkYXRhU291cmNlJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdoZWFkZXJzJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdmaXhlZEhlYWRlcnMnLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ2VkaXQuZW5hYmxlZCcsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnc2VsZWN0b3JzLnNhdmVCdXR0b24nLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ3Zpc2libGVDb2x1bW5OdW1iZXInLCBvcHRpb25zKTtcblx0dXBkYXRlVmFsdWUoJ29uQmVmb3JlRWRpdCcsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnb25WYWxpZGF0aW9uJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdvbkFmdGVyRWRpdCcsIG9wdGlvbnMpO1xuXHR1cGRhdGVWYWx1ZSgnb25CZWZvcmVTYXZlJywgb3B0aW9ucyk7XG5cdHVwZGF0ZVZhbHVlKCdvbkFmdGVyU2F2ZScsIG9wdGlvbnMpO1xuXG5cdGluaXRJbm5lckNhbGN1bGF0ZWRWYWx1ZXMoKTtcbn1cblxuZnVuY3Rpb24gaW5pdElubmVyU3RhdGljVmFsdWVzKCkge1xuXHRjb25maWdJbnN0YW5jZS5pbm5lciA9IHt9O1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMgPSB7fTtcblxuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93VG9wID0gJ2J1ZmZlci1yb3ctdG9wJztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd0JvdHRvbSA9ICdidWZmZXItcm93LWJvdHRvbSc7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0ID0gJ2J1ZmZlci1jb2x1bW4tbGVmdCc7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5SaWdodCA9ICdidWZmZXItY29sdW1uLXJpZ2h0Jztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmhlYWRlclJvdyA9ICdoZWFkZXItcm93Jztcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwgPSAnaGVhZGVyLWNlbGwnO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdyA9ICdkYXRhLXJvdyc7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCA9ICdkYXRhLWNlbGwnO1xuXG5cdC8vIE1pbmltdW0gYnVmZmVyIGNlbGwgaGVpZ2h0LiBBesOpcnQgdmFuIHLDoSBzesO8a3PDqWcsIG1lcnQgaGEgbmluY3MgbWVnYWR2YSwgYWtrb3IgdWdyaWsgZWd5ZXR0IGEgc2Nyb2xsIGhhIGEgdsOpZ8OpcmUgdmFneSBheiBlbGVqw6lyZSDDqXJ0w7xuayBhIHTDoWJsw6F6YXRiYW5cblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIubWluQ2VsbEhlaWdodCA9IDI7XG5cblx0Ly8gQXogb2Zmc2V0IG1pYXR0IGtlbGwgYSBzesOhbW9sw6FzaG96XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnRhYmxlSGVpZ2h0T2Zmc2V0ID0gY29uZmlnSW5zdGFuY2UuaW5uZXIubWluQ2VsbEhlaWdodCAqIDI7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzID0gW107XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmxlZnRDZWxsT2Zmc2V0ID0gMDtcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIudG9wQ2VsbE9mZnNldCA9IDA7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQob3B0aW9ucykge1xuXHR2YXIgY29udGFpbmVySGVpZ2h0ID0gZ2V0SW5uZXJWYWx1ZShvcHRpb25zLCAnZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQnKTtcblxuXHRpZiAodHlwZW9mIGNvbnRhaW5lckhlaWdodCA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbnRhaW5lckhlaWdodCA9IGNvbmZpZ1V0aWwuZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodChjb25maWdJbnN0YW5jZSk7XG5cdH1cblxuXHR1cGRhdGVWYWx1ZSgnZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQnLCBjb25maWdVdGlsLmNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoY29uZmlnSW5zdGFuY2UsIGNvbnRhaW5lckhlaWdodCkpO1xufVxuXG5mdW5jdGlvbiBpbml0SW5uZXJDYWxjdWxhdGVkVmFsdWVzKCkge1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlciA9IGNvbmZpZ1V0aWwuZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIoY29uZmlnSW5zdGFuY2UpO1xuXHRjb25maWdJbnN0YW5jZS5pbm5lci5jb2xzcGFuT2Zmc2V0ID0gY29uZmlnVXRpbC5nZXRNYXhDb2xzcGFuKGNvbmZpZ0luc3RhbmNlKTtcblx0Y29uZmlnSW5zdGFuY2UuaW5uZXIudmlzaWJsZVJvd051bWJlciA9IGNvbmZpZ1V0aWwuZ2V0VmlzaWJsZVJvd051bWJlcihjb25maWdJbnN0YW5jZSk7XG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIgPSBjb25maWdVdGlsLmdldFZpc2libGVDb2x1bW5OdW1iZXIoY29uZmlnSW5zdGFuY2UpO1xuXHRjb25maWdJbnN0YW5jZS50YWJsZVdpZHRoID0gY29uZmlnVXRpbC5nZXRUYWJsZVdpZHRoKGNvbmZpZ0luc3RhbmNlKTtcblx0Y29uZmlnSW5zdGFuY2UudGFibGVIZWlnaHQgPSBjb25maWdVdGlsLmdldFRhYmxlSGVpZ2h0KGNvbmZpZ0luc3RhbmNlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVmFsdWUoa2V5LCBvcHRpb25zKSB7XG5cdHZhciB0YXJnZXQgPSBnZXRJbm5lck9iamVjdChjb25maWdJbnN0YW5jZSwga2V5KSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuXHRcdHZhbHVlID0gZ2V0SW5uZXJWYWx1ZShvcHRpb25zLCBrZXkpLFxuXHRcdGtleXMgPSBrZXkuc3BsaXQoJy4nKSxcblx0XHRsYXN0S2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuXG5cdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHR0YXJnZXRbbGFzdEtleV0gPSB0eXBlb2YgZ2V0SW5uZXJWYWx1ZShERUZBVUxUUywga2V5KSA9PSAnZnVuY3Rpb24nID8gZ2V0SW5uZXJWYWx1ZShERUZBVUxUUywga2V5KShjb25maWdJbnN0YW5jZSkgOiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpO1xuXHR9IGVsc2Uge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHZhbHVlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldElubmVyT2JqZWN0KG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblxuXHR2YXIgc3ViS2V5ID0ga2V5LnNwbGl0KCcuJylbMF0sXG5cdFx0c3ViT2JqZWN0ID0gb2JqZWN0W3N1YktleV07XG5cblx0aWYgKHR5cGVvZiBzdWJPYmplY3QgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRvYmplY3Rbc3ViS2V5XSA9IHt9O1xuXHRcdHN1Yk9iamVjdCA9IG9iamVjdFtzdWJLZXldO1xuXHR9XG5cblx0cmV0dXJuIGdldElubmVyT2JqZWN0KHN1Yk9iamVjdCwga2V5LnN1YnN0cmluZyhrZXkuaW5kZXhPZignLicpICsgMSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbm5lclZhbHVlKG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Rba2V5XTtcblx0fVxuXG5cdHZhciBzdWJLZXkgPSBrZXkuc3BsaXQoJy4nKVswXSxcblx0XHRzdWJPYmplY3QgPSBvYmplY3Rbc3ViS2V5XTtcblxuXHRpZiAodHlwZW9mIHN1Yk9iamVjdCA9PSAndW5kZWZpbmVkJykge1xuXHRcdHJldHVybiBzdWJPYmplY3Q7XG5cdH1cblxuXHRyZXR1cm4gZ2V0SW5uZXJWYWx1ZShzdWJPYmplY3QsIGtleS5zdWJzdHJpbmcoa2V5LmluZGV4T2YoJy4nKSArIDEpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IGluaXQsXG5cdHVwZGF0ZVZhbHVlOiB1cGRhdGVWYWx1ZVxufTtcbn0se1wiLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb25cIjoyLFwiLi4vdXRpbHMvY29uZmlndXJhdGlvblwiOjksXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxM31dLDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uZmlndXJhdGlvbiAgICA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbicpLFxuXHRldmVudEhhbmRsZXJVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZXZlbnQtaGFuZGxlcicpLFxuXHRnZW5lcmF0b3JVdGlsICAgID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2VuZXJhdG9yJyksXG5cdGRvbVV0aWwgICAgICAgICAgPSByZXF1aXJlKCcuLi91dGlscy9kb20nKTtcblxudmFyIGNvbmZpZ0luc3RhbmNlICAgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVRhYmxlKGlkLCBvcHRpb25zKSB7XG5cdGNvbmZpZ3VyYXRpb24uaW5pdChvcHRpb25zKTtcblxuXHRnZW5lcmF0b3JVdGlsLmluaXRUYWJsZShjb25maWdJbnN0YW5jZSk7XG5cdGdlbmVyYXRvclV0aWwuaW5pdEJ1ZmZlcnMoY29uZmlnSW5zdGFuY2UpO1xuXG5cdGRvbVV0aWwudXBkYXRlVGFibGUoKTtcblxuXHRldmVudEhhbmRsZXJVdGlsLmFkZEV2ZW50cygpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95VGFibGUoKSB7XG5cdGV2ZW50SGFuZGxlclV0aWwucmVtb3ZlRXZlbnRzKCk7XG5cdGRvbVV0aWwuZGVzdHJveVRhYmxlKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZW5lcmF0ZVRhYmxlOiBnZW5lcmF0ZVRhYmxlLFxuXHRkZXN0cm95VGFibGU6IGRlc3Ryb3lUYWJsZVxufTtcbn0se1wiLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb25cIjoyLFwiLi4vdXRpbHMvZG9tXCI6MTAsXCIuLi91dGlscy9ldmVudC1oYW5kbGVyXCI6MTIsXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxMyxcIi4vY29uZmlndXJhdGlvblwiOjV9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuaWYgKHR5cGVvZiBBcnJheS5wcm90b3R5cGUuZmluZCA9PSAndW5kZWZpbmVkJykge1xuXHRBcnJheS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dGVuZC1uYXRpdmVcblx0XHRpZiAodGhpcyA9PT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLmZpbmQgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cblx0XHR2YXIgbGlzdCA9IE9iamVjdCh0aGlzKTtcblx0XHR2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG5cdFx0dmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG5cdFx0dmFyIHZhbHVlO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0dmFsdWUgPSBsaXN0W2ldO1xuXHRcdFx0aWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0KSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZmluZWRcblx0fTtcbn1cbn0se31dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIU5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoKSB7XG5cdE5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIGFyZ3VtZW50KSB7XG5cdFx0YXJndW1lbnQgPSBhcmd1bWVudCB8fCB3aW5kb3c7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoYXJndW1lbnQsIHRoaXNbaV0sIGksIHRoaXMpO1xuXHRcdH1cblx0fTtcbn1cbn0se31dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGluc3RhbmNlLCBoZWlnaHQpIHtcblx0aWYgKHR5cGVvZiBoZWlnaHQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZXR1cm4gaGVpZ2h0O1xuXHR9XG5cblx0cmV0dXJuIGluc3RhbmNlLmlubmVyLnRhYmxlSGVpZ2h0T2Zmc2V0ICsgTWF0aC5mbG9vcihoZWlnaHQgLyBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQpICogaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0O1xufVxuXG5mdW5jdGlvbiBnZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0KGluc3RhbmNlKSB7XG5cdHJldHVybiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGluc3RhbmNlLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGluc3RhbmNlLnNlbGVjdG9ycy5tYWluQ29udGFpbmVyKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSA2NCk7XG59XG5cbmZ1bmN0aW9uIGdldEluZGV4T2ZDZWxsS2V5SGVhZGVyKGluc3RhbmNlKSB7XG5cdHJldHVybiBpbnN0YW5jZS5oZWFkZXJzLmxlbmd0aCAtIDE7XG59XG5cbmZ1bmN0aW9uIGdldE1heENvbHNwYW4oaW5zdGFuY2UpIHtcblx0dmFyIG1heFZhbCA9IDA7XG5cblx0aW5zdGFuY2UuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0XHRlbGVtZW50LmZvckVhY2goZnVuY3Rpb24oc3ViRWxlbWVudCkge1xuXHRcdFx0aWYgKHR5cGVvZiBzdWJFbGVtZW50LmNvbHNwYW4gIT0gJ3VuZGVmaW5lZCcgJiYgbWF4VmFsIDwgc3ViRWxlbWVudC5jb2xzcGFuKSB7XG5cdFx0XHRcdG1heFZhbCA9IHN1YkVsZW1lbnQuY29sc3Bhbjtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIG1heFZhbDtcbn1cblxuZnVuY3Rpb24gZ2V0VmlzaWJsZVJvd051bWJlcihpbnN0YW5jZSkge1xuXHRyZXR1cm4gTWF0aC5mbG9vcigoaW5zdGFuY2UuZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQgLSBpbnN0YW5jZS5pbm5lci50YWJsZUhlaWdodE9mZnNldCkgLyBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQpIC0gaW5zdGFuY2UuaGVhZGVycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIGdldFZpc2libGVDb2x1bW5OdW1iZXIoaW5zdGFuY2UpIHtcblx0cmV0dXJuIE1hdGguZmxvb3IoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikub2Zmc2V0V2lkdGggLyBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCArXG5cdFx0KGluc3RhbmNlLmlubmVyLmNvbHNwYW5PZmZzZXQgPiAyID8gaW5zdGFuY2UuaW5uZXIuY29sc3Bhbk9mZnNldCA6IDIpICsgaW5zdGFuY2UuaW5uZXIuY29sc3Bhbk9mZnNldCk7XG59XG5cbmZ1bmN0aW9uIGdldFRhYmxlV2lkdGgoaW5zdGFuY2UpIHtcblx0cmV0dXJuIChpbnN0YW5jZS5oZWFkZXJzW2luc3RhbmNlLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXS5sZW5ndGggLSBpbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyKSAqIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbFdpZHRoO1xufVxuXG5mdW5jdGlvbiBnZXRUYWJsZUhlaWdodChpbnN0YW5jZSkge1xuXHRyZXR1cm4gKGluc3RhbmNlLmRhdGFTb3VyY2UubGVuZ3RoIC0gaW5zdGFuY2UuaW5uZXIudmlzaWJsZVJvd051bWJlciArIDEpICogaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0O1xufVxuXG5mdW5jdGlvbiBuaWwoKSB7XG5cdHJldHVybiBmdW5jdGlvbigpIHt9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Y2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodDogY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodCxcblx0Z2V0RGVmYXVsdENvbnRhaW5lckhlaWdodDogZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodCxcblx0Z2V0SW5kZXhPZkNlbGxLZXlIZWFkZXI6IGdldEluZGV4T2ZDZWxsS2V5SGVhZGVyLFxuXHRnZXRNYXhDb2xzcGFuOiBnZXRNYXhDb2xzcGFuLFxuXHRnZXRWaXNpYmxlUm93TnVtYmVyOiBnZXRWaXNpYmxlUm93TnVtYmVyLFxuXHRnZXRWaXNpYmxlQ29sdW1uTnVtYmVyOiBnZXRWaXNpYmxlQ29sdW1uTnVtYmVyLFxuXHRnZXRUYWJsZVdpZHRoOiBnZXRUYWJsZVdpZHRoLFxuXHRnZXRUYWJsZUhlaWdodDogZ2V0VGFibGVIZWlnaHQsXG5cdG5pbDogbmlsXG59O1xufSx7fV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBpbmRleE9mRWxlbWVudChlbGVtZW50KSB7XG5cdHZhciBjb2xsZWN0aW9uID0gZWxlbWVudC5wYXJlbnROb2RlLmNoaWxkTm9kZXM7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKGNvbGxlY3Rpb25baV0gPT09IGVsZW1lbnQpIHtcblx0XHRcdHJldHVybiBpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2VsbChjZWxsLCBjZWxsT2JqKSB7XG5cdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai52YWx1ZTtcblx0Y2VsbC5jbGFzc05hbWUgPSBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwgKyAnICcgKyAoY2VsbE9iai5jbGFzcyB8fCAnJyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVRhYmxlKCkge1xuXHR2YXIgY291bnRSb3cgPSAwLFxuXHRcdGNvbHNwYW4gPSAxO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpLmZvckVhY2goZnVuY3Rpb24ocm93KSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR2YXIgY2VsbE9iaiA9IGNvbmZpZ0luc3RhbmNlLmhlYWRlcnNbY291bnRSb3ddW2NvbmZpZ0luc3RhbmNlLmlubmVyLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcl07XG5cblx0XHRcdGlmIChjb2xzcGFuID4gMSkge1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGNvbHNwYW4tLTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai50ZXh0IHx8IGNlbGxPYmoua2V5IHx8ICcnO1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAndGFibGUtY2VsbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgY2VsbE9iai5jb2xzcGFuID09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNlbGwucmVtb3ZlQXR0cmlidXRlKCdjb2xzcGFuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2FsY3VsYXRlZENvbHNwYW4gPSBjb25maWdJbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyIDw9IGNlbGxOdW1iZXIgKyBjZWxsT2JqLmNvbHNwYW4gPyBjb25maWdJbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyIC0gY2VsbE51bWJlciA6IGNlbGxPYmouY29sc3BhbjtcblxuXHRcdFx0XHRjZWxsLnNldEF0dHJpYnV0ZSgnY29sc3BhbicsIGNhbGN1bGF0ZWRDb2xzcGFuKTtcblx0XHRcdFx0Y29sc3BhbiA9IGNhbGN1bGF0ZWRDb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGNvdW50Um93Kys7XG5cdFx0Y29sc3BhbiA9IDE7XG5cdH0pO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWdJbnN0YW5jZS5pbm5lci50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjb25maWdJbnN0YW5jZS5pbm5lci5sZWZ0Q2VsbE9mZnNldCArIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRUYWJsZSArICcgdHIuJyArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Rml4ZWRDZWxsKGNvbmZpZ0luc3RhbmNlLmlubmVyLnRvcENlbGxPZmZzZXQgKyByb3dOdW1iZXIsIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0RWRpdGluZ0NlbGwob25JbnB1dEJsdXJFdmVudEhhbmRsZXIpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLmVkaXRpbmdDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGVkaXRpbmdDZWxsKSB7XG5cdFx0dmFyIGlucHV0ID0gZWRpdGluZ0NlbGwucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcblxuXHRcdGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdFx0ZWRpdGluZ0NlbGwuaW5uZXJIVE1MID0gaW5wdXQudmFsdWU7XG5cdFx0ZWRpdGluZ0NlbGwuY2xhc3NMaXN0LnJlbW92ZShjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRFZGl0ZWRDZWxsKCkge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpLmZvckVhY2goZnVuY3Rpb24oZWRpdGVkQ2VsbCkge1xuXHRcdGVkaXRlZENlbGwuY2xhc3NMaXN0LnJlbW92ZShjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzID0gW107XG5cdHVwZGF0ZVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZSgpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMubWFpbkNvbnRhaW5lcikuaW5uZXJIVE1MID0gJyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbmRleE9mRWxlbWVudDogaW5kZXhPZkVsZW1lbnQsXG5cdHVwZGF0ZUNlbGw6IHVwZGF0ZUNlbGwsXG5cdHVwZGF0ZVRhYmxlOiB1cGRhdGVUYWJsZSxcblx0cmVzZXRFZGl0aW5nQ2VsbDogcmVzZXRFZGl0aW5nQ2VsbCxcblx0cmVzZXRFZGl0ZWRDZWxsOiByZXNldEVkaXRlZENlbGwsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjIsXCIuL3RhYmxlXCI6MTR9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEFyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL21vZGVscy9ldmVudC1hcmd1bWVudHMnKSxcblx0dGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpLFxuXHRkb21VdGlsICAgPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBzYXZlQ2VsbHMoKSB7XG5cdGlmICghY29uZmlnSW5zdGFuY2UuZWRpdC5lbmFibGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGFyZ3MgPSBuZXcgRXZlbnRBcmd1bWVudHMoe1xuXHRcdGNlbGxPYmplY3Q6IGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWdJbnN0YW5jZS5ldmVudEhhbmRsZXJzLm9uQmVmb3JlU2F2ZShhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHRjb25maWdJbnN0YW5jZS5pbm5lci5lZGl0ZWRDZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdHRhYmxlVXRpbC5zZXRDZWxsVmFsdWUoY2VsbC5yb3dOdW1iZXIsIGNlbGwuY29sdW1uTnVtYmVyLCBjZWxsLnZhbHVlKTtcblx0XHR9KTtcblx0XHRkb21VdGlsLnJlc2V0RWRpdGVkQ2VsbCgpO1xuXG5cdFx0Y29uZmlnSW5zdGFuY2UuZXZlbnRIYW5kbGVycy5vbkFmdGVyU2F2ZShhcmdzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2F2ZUNlbGxzOiBzYXZlQ2VsbHNcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MixcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjo0LFwiLi9kb21cIjoxMCxcIi4vdGFibGVcIjoxNH1dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50QXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50cycpO1xuXG52YXIgZG9tVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2RvbScpLFxuXHR0YWJsZVV0aWwgPSByZXF1aXJlKCcuLi91dGlscy90YWJsZScpLFxuXHRlZGl0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2VkaXQnKSxcblx0Z2VuZXJhdG9yVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG52YXIgY29udGFpbmVyO1xuXG5mdW5jdGlvbiBvbldoZWVsRXZlbnRIYW5kbGVyKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0Y29udGFpbmVyLnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVk7XG5cdGNvbnRhaW5lci5zY3JvbGxMZWZ0ICs9IGV2ZW50LmRlbHRhWDtcbn1cblxuZnVuY3Rpb24gb25TY3JvbGxFdmVudEhhbmRsZXIoKSB7XG5cdGRvbVV0aWwucmVzZXRFZGl0aW5nQ2VsbChvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdGdlbmVyYXRvclV0aWwuaW5pdEJ1ZmZlcnMoY29uZmlnSW5zdGFuY2UpO1xuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKCkge1xuXHR2YXIgY2VsbCA9IHRoaXMucGFyZW50Tm9kZSxcblx0XHRyb3dOdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwucGFyZW50Tm9kZSkgKyBjb25maWdJbnN0YW5jZS5pbm5lci50b3BDZWxsT2Zmc2V0LFxuXHRcdGNvbHVtbk51bWJlciA9IGRvbVV0aWwuaW5kZXhPZkVsZW1lbnQoY2VsbCkgLSAxICsgY29uZmlnSW5zdGFuY2UuaW5uZXIubGVmdENlbGxPZmZzZXQsXG5cdFx0ZWRpdGVkT2JqID0gdGFibGVVdGlsLmdldENlbGwocm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpO1xuXG5cdGVkaXRlZE9iai51cGRhdGVBdHRyaWJ1dGVzKHtcblx0XHR2YWx1ZTogdGhpcy52YWx1ZSxcblx0XHRjbGFzczogY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLmVkaXRlZENlbGxcblx0fSk7XG5cblx0aWYgKCF0YWJsZVV0aWwuaXNDZWxsQ2hhbmdlZChlZGl0ZWRPYmopKSB7XG5cdFx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsOiBjZWxsLFxuXHRcdGNlbGxPYmplY3Q6IGVkaXRlZE9iaixcblx0XHRjYW5jZWxFdmVudDogZmFsc2Vcblx0fSk7XG5cblx0Y29uZmlnSW5zdGFuY2UuZXZlbnRIYW5kbGVycy5vblZhbGlkYXRpb24oYXJncyk7XG5cblx0aWYgKGFyZ3MuY2FuY2VsRWRpdCAhPT0gdHJ1ZSkge1xuXHRcdHRhYmxlVXRpbC5zZXRVcGRhdGVkQ2VsbFZhbHVlKGFyZ3MuY2VsbE9iamVjdCk7XG5cdFx0ZG9tVXRpbC51cGRhdGVDZWxsKGFyZ3MuY2VsbCwgYXJncy5jZWxsT2JqZWN0KTtcblxuXHRcdGNvbmZpZ0luc3RhbmNlLmV2ZW50SGFuZGxlcnMub25BZnRlckVkaXQoYXJncyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DbGlja0NlbGxFdmVudEhhbmRsZXIoKSB7XG5cdGlmICghY29uZmlnSW5zdGFuY2UuZWRpdC5lbmFibGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIHJvd051bWJlciA9IGRvbVV0aWwuaW5kZXhPZkVsZW1lbnQodGhpcy5wYXJlbnROb2RlKSArIGNvbmZpZ0luc3RhbmNlLmlubmVyLnRvcENlbGxPZmZzZXQsXG5cdFx0Y29sdW1uTnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudCh0aGlzKSAtIDEgKyBjb25maWdJbnN0YW5jZS5pbm5lci5sZWZ0Q2VsbE9mZnNldCxcblx0XHRlZGl0ZWRPYmogPSB0YWJsZVV0aWwuZ2V0Q2VsbChyb3dOdW1iZXIsIGNvbHVtbk51bWJlciksXG5cdFx0aW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG5cdGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cblx0dmFyIGFyZ3MgPSBuZXcgRXZlbnRBcmd1bWVudHMoe1xuXHRcdGNlbGw6IHRoaXMsXG5cdFx0Y2VsbE9iamVjdDogZWRpdGVkT2JqLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWdJbnN0YW5jZS5ldmVudEhhbmRsZXJzLm9uQmVmb3JlRWRpdChhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5hZGQoY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLmVkaXRpbmdDZWxsKTtcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLmVkaXRlZENlbGwpO1xuXHRcdHRoaXMuaW5uZXJIVE1MID0gJyc7XG5cdFx0dGhpcy5hcHBlbmRDaGlsZChpbnB1dCk7XG5cblx0XHRpbnB1dC5mb2N1cygpO1xuXHRcdGlucHV0LnZhbHVlID0gZWRpdGVkT2JqLnZhbHVlO1xuXHRcdGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdH1cbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuXHRjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlciwgeyBwYXNzaXZlOiBmYWxzZSwgY2FwdHVyZTogdHJ1ZSB9KTtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgb25TY3JvbGxFdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZ0luc3RhbmNlLmVkaXQuZW5hYmxlZCAmJiBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMuc2F2ZUJ1dHRvbiAhPT0gbnVsbCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnSW5zdGFuY2Uuc2VsZWN0b3JzLnNhdmVCdXR0b24pLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZWRpdFV0aWwuc2F2ZUNlbGxzKTtcblx0fVxuXG5cdGlmIChjb25maWdJbnN0YW5jZS5lZGl0LmVuYWJsZWQpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZ0luc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWdJbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25DbGlja0NlbGxFdmVudEhhbmRsZXIpO1xuXHRcdH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50cygpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWdJbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgb25TY3JvbGxFdmVudEhhbmRsZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0b25DbGlja0NlbGxFdmVudEhhbmRsZXI6IG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyLFxuXHRhZGRFdmVudHM6IGFkZEV2ZW50cyxcblx0cmVtb3ZlRXZlbnRzOiByZW1vdmVFdmVudHNcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MixcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjo0LFwiLi4vdXRpbHMvZG9tXCI6MTAsXCIuLi91dGlscy9lZGl0XCI6MTEsXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxMyxcIi4uL3V0aWxzL3RhYmxlXCI6MTR9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaXRDb250YWluZXJzKGluc3RhbmNlKSB7XG5cdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGluc3RhbmNlLnNlbGVjdG9ycy5tYWluQ29udGFpbmVyKSxcblx0XHR2aXJ0dWFsQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0dmlydHVhbFRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKSxcblx0XHRmaXhlZENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdGZpeGVkVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpO1xuXG5cdHZpcnR1YWxDb250YWluZXIuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcik7XG5cdHZpcnR1YWxUYWJsZS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUpO1xuXHRmaXhlZENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLnNlbGVjdG9ycy5maXhlZENvbnRhaW5lcik7XG5cdGZpeGVkVGFibGUuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsQ29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxUYWJsZSk7XG5cblx0dmlydHVhbENvbnRhaW5lci5zdHlsZS5tYXhIZWlnaHQgPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCArICdweCc7XG5cdHZpcnR1YWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblxuXHRmaXhlZENvbnRhaW5lci5zdHlsZS5wYWRkaW5nID0gaW5zdGFuY2UuaW5uZXIubWluQ2VsbEhlaWdodCArICdweCAwJztcblx0Zml4ZWRDb250YWluZXIuc3R5bGUuZmxvYXQgPSAnbGVmdCc7XG59XG5cbmZ1bmN0aW9uIGluaXRUYWJsZShpbnN0YW5jZSkge1xuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIHRhYmxlXG5cdHZhciB2aXJ0dWFsVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdHZpcnR1YWxUYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rib2R5JyksXG5cdFx0dHJIZWFkQnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuXHR0ckhlYWRCdWZmZXIuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93VG9wQ2xhc3MpO1xuXG5cdHZhciBpLCBqLCB0ckhlYWQsIHRyQm9keSwgYnVmZmVyQ29sdW1uTGVmdCwgYnVmZmVyQ29sdW1uUmlnaHQsIGJ1ZmZlclJvd0JvdHRvbSwgdGRFbGVtZW50O1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgaGVhZGVyXG5cdGJ1ZmZlckNvbHVtbkxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5MZWZ0LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXG5cdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZChidWZmZXJDb2x1bW5MZWZ0KTtcblxuXHRmb3IgKGkgPSAwOyBpIDwgaW5zdGFuY2UuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaSsrKSB7XG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdH1cblxuXHRidWZmZXJDb2x1bW5SaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdGJ1ZmZlckNvbHVtblJpZ2h0LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQoYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdHZpcnR1YWxUaGVhZC5hcHBlbmRDaGlsZCh0ckhlYWRCdWZmZXIpO1xuXG5cdGluc3RhbmNlLmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXJSb3cpIHtcblx0XHR0ckhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRySGVhZC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpO1xuXHRcdHRySGVhZC5zdHlsZS5oZWlnaHQgPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBpbnN0YW5jZS5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0XHR0ZEVsZW1lbnQuaW5uZXJIVE1MID0gaGVhZGVyUm93W2pdLnRleHQgfHwgaGVhZGVyUm93W2pdLmtleSB8fCAnJztcblxuXHRcdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkKTtcblx0fSk7XG5cblx0Ly8gR2VuZXJhdGUgdmlydHVhbCBib2R5XG5cdGZvciAoaSA9IDA7IGkgPCBpbnN0YW5jZS5pbm5lci52aXNpYmxlUm93TnVtYmVyOyBpKyspIHtcblx0XHR0ckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRyQm9keS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgaW5zdGFuY2UuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKTtcblx0XHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4JztcblxuXHRcdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQodHJCb2R5KTtcblx0fVxuXG5cdGJ1ZmZlclJvd0JvdHRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdGJ1ZmZlclJvd0JvdHRvbS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dCb3R0b20pO1xuXG5cdHZpcnR1YWxUYm9keS5hcHBlbmRDaGlsZChidWZmZXJSb3dCb3R0b20pO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSkuYXBwZW5kQ2hpbGQodmlydHVhbFRoZWFkKTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGJvZHkpO1xuXG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlckxlZnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0KTtcblx0aW5zdGFuY2UuaW5uZXIuYnVmZmVyUmlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5SaWdodCk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlclRvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblx0aW5zdGFuY2UuaW5uZXIuYnVmZmVyQm90dG9tID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tKTtcblxuXHQvLyBHZW5lcmF0ZSBmaXhlZCB0YWJsZVxuXG5cdGlmIChpbnN0YW5jZS5maXhlZEhlYWRlcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGZpeGVkVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdGZpeGVkVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGhlYWRlclxuXG5cdGZvciAoaSA9IDA7IGkgPCBpbnN0YW5jZS5maXhlZEhlYWRlcnMubGVuZ3RoOyBpKyspIHtcblx0XHR0ckhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRySGVhZC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpO1xuXHRcdHRySGVhZC5zdHlsZS5oZWlnaHQgPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGluc3RhbmNlLmZpeGVkSGVhZGVyc1tpXS5sZW5ndGg7IGorKykge1xuXHRcdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJDZWxsKTtcblx0XHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV1bal0udGV4dCB8fCBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV1bal0ua2V5IHx8ICcnO1xuXG5cdFx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH1cblxuXHQvLyBHZW5lcmF0ZSBmaXhlZCBib2R5XG5cblx0Zm9yIChpID0gMDsgaSA8IGluc3RhbmNlLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaW5uZXIuc2VsZWN0b3JzLmRhdGFSb3cpO1xuXHRcdHRyQm9keS5zdHlsZS5oZWlnaHQgPSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGluc3RhbmNlLmZpeGVkSGVhZGVyc1tpbnN0YW5jZS5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRib2R5LmFwcGVuZENoaWxkKHRyQm9keSk7XG5cdH1cblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnNlbGVjdG9ycy5maXhlZFRhYmxlKS5hcHBlbmRDaGlsZChmaXhlZFRoZWFkKTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5zZWxlY3RvcnMuZml4ZWRUYWJsZSkuYXBwZW5kQ2hpbGQoZml4ZWRUYm9keSk7XG59XG5cbmZ1bmN0aW9uIGluaXRCdWZmZXJzKGluc3RhbmNlKSB7XG5cdHZhciBsZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikuc2Nyb2xsTGVmdCAtIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbExlZnQgJSBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCAtIGluc3RhbmNlLmlubmVyLmNvbHNwYW5PZmZzZXQgKiBpbnN0YW5jZS5kaW1lbnNpb25zLmNlbGxXaWR0aCxcblx0XHRyaWdodCA9IGluc3RhbmNlLnRhYmxlV2lkdGggLSBsZWZ0LFxuXHRcdHRvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2Uuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbFRvcCxcblx0XHRib3R0b20gPSBpbnN0YW5jZS50YWJsZUhlaWdodCAtIHRvcDtcblxuXHRsZWZ0ID0gbGVmdCA+IGluc3RhbmNlLnRhYmxlV2lkdGggPyBpbnN0YW5jZS50YWJsZVdpZHRoIDogbGVmdDtcblx0bGVmdCA9IGxlZnQgPCAwID8gMCA6IGxlZnQ7XG5cdHJpZ2h0ID0gaW5zdGFuY2UudGFibGVXaWR0aCAtIGxlZnQ7XG5cdHRvcCA9IHRvcCArIGluc3RhbmNlLmlubmVyLm1pbkNlbGxIZWlnaHQgPiBpbnN0YW5jZS50YWJsZUhlaWdodCA/IGluc3RhbmNlLnRhYmxlSGVpZ2h0ICsgaW5zdGFuY2UuaW5uZXIubWluQ2VsbEhlaWdodCA6IHRvcCArIGluc3RhbmNlLmlubmVyLm1pbkNlbGxIZWlnaHQ7XG5cdGJvdHRvbSA9IGluc3RhbmNlLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGluc3RhbmNlLmlubmVyLmxlZnRDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcihsZWZ0IC8gaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsV2lkdGgpO1xuXHRpbnN0YW5jZS5pbm5lci50b3BDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcigodG9wIC0gdG9wICUgaW5zdGFuY2UuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KSAvIGluc3RhbmNlLmRpbWVuc2lvbnMuY2VsbEhlaWdodCk7XG5cblx0aW5zdGFuY2UuaW5uZXIuYnVmZmVyTGVmdC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSBsZWZ0ICsgJ3B4Jztcblx0fSk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlclJpZ2h0LmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5taW5XaWR0aCA9IHJpZ2h0ICsgJ3B4Jztcblx0fSk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlclRvcC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUuaGVpZ2h0ID0gdG9wICsgJ3B4Jztcblx0fSk7XG5cdGluc3RhbmNlLmlubmVyLmJ1ZmZlckJvdHRvbS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUuaGVpZ2h0ID0gYm90dG9tICsgJ3B4Jztcblx0fSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0VGFibGU6IGluaXRUYWJsZSxcblx0aW5pdENvbnRhaW5lcnM6IGluaXRDb250YWluZXJzLFxuXHRpbml0QnVmZmVyczogaW5pdEJ1ZmZlcnNcbn07XG59LHt9XSwxNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBDZWxsID0gcmVxdWlyZSgnLi4vbW9kZWxzL2NlbGwnKTtcblxudmFyIGNvbmZpZ0luc3RhbmNlID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb24nKTtcblxuZnVuY3Rpb24gZ2V0Q2VsbChyb3dOdW1iZXIsIGNvbHVtbk51bWJlcikge1xuXHR2YXIgY2VsbE9iaiA9IGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IHJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNvbHVtbk51bWJlcjtcblx0XHR9KSxcblx0XHRyb3dPYmogPSBjb25maWdJbnN0YW5jZS5oZWFkZXJzW2NvbmZpZ0luc3RhbmNlLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRpZiAodHlwZW9mIGNlbGxPYmogPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRjZWxsT2JqID0gbmV3IENlbGwoe1xuXHRcdFx0a2V5OiByb3dPYmpbY29sdW1uTnVtYmVyXS5rZXksXG5cdFx0XHR2YWx1ZTogY29uZmlnSW5zdGFuY2UuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV1cblx0XHR9KTtcblxuXHRcdGNlbGxPYmoudXBkYXRlQXR0cmlidXRlcyh7XG5cdFx0XHRyb3dOdW1iZXI6IHJvd051bWJlcixcblx0XHRcdGNvbHVtbk51bWJlcjogY29sdW1uTnVtYmVyXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gY2VsbE9iajtcbn1cblxuZnVuY3Rpb24gZ2V0Rml4ZWRDZWxsKHJvd051bWJlciwgY29sdW1uTnVtYmVyKSB7XG5cdHZhciBjZWxsT2JqID0gbnVsbCxcblx0XHRyb3dPYmogPSBjb25maWdJbnN0YW5jZS5maXhlZEhlYWRlcnNbY29uZmlnSW5zdGFuY2UuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGNlbGxPYmogPSBuZXcgQ2VsbCh7XG5cdFx0a2V5OiByb3dPYmpbY29sdW1uTnVtYmVyXS5rZXksXG5cdFx0dmFsdWU6IGNvbmZpZ0luc3RhbmNlLmRhdGFTb3VyY2Vbcm93TnVtYmVyXVtyb3dPYmpbY29sdW1uTnVtYmVyXS5rZXldXG5cdH0pO1xuXG5cdHJldHVybiBjZWxsT2JqO1xufVxuXG5mdW5jdGlvbiBzZXRDZWxsVmFsdWUocm93TnVtYmVyLCBjb2x1bW5OdW1iZXIsIHZhbHVlKSB7XG5cdHZhciByb3dPYmogPSBjb25maWdJbnN0YW5jZS5oZWFkZXJzW2NvbmZpZ0luc3RhbmNlLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjb25maWdJbnN0YW5jZS5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0NlbGxDaGFuZ2VkKGNlbGxPYmopIHtcblx0dmFyIG9yaWdpbmFsT2JqID0gZ2V0Q2VsbChjZWxsT2JqLnJvd051bWJlciwgY2VsbE9iai5jb2x1bW5OdW1iZXIpLFxuXHRcdGVkaXRlZE9iaiA9IGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdFx0fSksXG5cdFx0b3JpZ2luYWxWYWwgPSBvcmlnaW5hbE9iai52YWx1ZSB8fCAnJztcblxuXHRyZXR1cm4gb3JpZ2luYWxWYWwgIT09IGNlbGxPYmoudmFsdWUgfHwgdHlwZW9mIGVkaXRlZE9iaiAhPSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gc2V0VXBkYXRlZENlbGxWYWx1ZShjZWxsT2JqKSB7XG5cdHZhciBwcmV2ID0gY29uZmlnSW5zdGFuY2UuaW5uZXIuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdH0pO1xuXG5cdGlmICh0eXBlb2YgcHJldiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbmZpZ0luc3RhbmNlLmlubmVyLmVkaXRlZENlbGxzLnB1c2goY2VsbE9iaik7XG5cdH0gZWxzZSB7XG5cdFx0cHJldi52YWx1ZSA9IGNlbGxPYmoudmFsdWU7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldENlbGw6IGdldENlbGwsXG5cdGdldEZpeGVkQ2VsbDogZ2V0Rml4ZWRDZWxsLFxuXHRzZXRDZWxsVmFsdWU6IHNldENlbGxWYWx1ZSxcblx0aXNDZWxsQ2hhbmdlZDogaXNDZWxsQ2hhbmdlZCxcblx0c2V0VXBkYXRlZENlbGxWYWx1ZTogc2V0VXBkYXRlZENlbGxWYWx1ZVxufTtcbn0se1wiLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb25cIjoyLFwiLi4vbW9kZWxzL2NlbGxcIjozfV19LHt9LFsxXSk7XG4iXSwiZmlsZSI6InZpcnR1YWwtZGF0YS1ncmlkLmpzIn0=
