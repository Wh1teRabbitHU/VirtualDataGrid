(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('./pollyfills/Array.find.js');require('./pollyfills/NodeList.forEach.js');

var VirtualDataGrid = require('./models/virtual-data-grid');

window.VirtualDataGrid = VirtualDataGrid;
},{"./models/virtual-data-grid":4,"./pollyfills/Array.find.js":7,"./pollyfills/NodeList.forEach.js":8}],2:[function(require,module,exports){
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

var generator = require('../modules/generator');

var uniqueIdSequence = 1;

function VirtualDataGrid() {
	var self = this;

	self.configuration = {};
	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.configuration, options);
	};
	self.destroyTable = function() {
		generator.destroyTable(self.configuration);
	};
	self.getId = function() {
		return self.uniqueId;
	};
}

module.exports = VirtualDataGrid;
},{"../modules/generator":6}],5:[function(require,module,exports){
'use strict';

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
		saveButton: null
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

function init(config, options) {
	initConfigObject(config);
	initInnerStaticValues(config);

	updateValue(config, options, 'selectors.mainContainer');
	updateValue(config, options, 'selectors.fixedContainer');
	updateValue(config, options, 'selectors.fixedTable');
	updateValue(config, options, 'selectors.virtualContainer');
	updateValue(config, options, 'selectors.virtualTable');
	updateValue(config, options, 'selectors.editingCell');
	updateValue(config, options, 'selectors.editedCell');
	updateValue(config, options, 'selectors.saveButton');
	updateValue(config, options, 'dimensions.cellWidth');
	updateValue(config, options, 'dimensions.cellHeight');

	calculateVirtualContainerHeight(config, options);

	generatorUtil.initContainers(config);

	updateValue(config, options, 'dataSource');
	updateValue(config, options, 'headers');
	updateValue(config, options, 'fixedHeaders');
	updateValue(config, options, 'edit.enabled');
	updateValue(config, options, 'eventHandlers.onBeforeEdit');
	updateValue(config, options, 'eventHandlers.onValidation');
	updateValue(config, options, 'eventHandlers.onAfterEdit');
	updateValue(config, options, 'eventHandlers.onBeforeSave');
	updateValue(config, options, 'eventHandlers.onAfterSave');

	initInnerCalculatedValues(config);
}

function initConfigObject(config) {
	config.selectors = {};
	config.eventHandlers = {};
	config.inner = {};
	config.inner.selectors = {};
}

function initInnerStaticValues(config) {
	config.inner.selectors.bufferRowTop = 'buffer-row-top';
	config.inner.selectors.bufferRowBottom = 'buffer-row-bottom';
	config.inner.selectors.bufferColumnLeft = 'buffer-column-left';
	config.inner.selectors.bufferColumnRight = 'buffer-column-right';
	config.inner.selectors.headerRow = 'header-row';
	config.inner.selectors.headerCell = 'header-cell';
	config.inner.selectors.dataRow = 'data-row';
	config.inner.selectors.dataCell = 'data-cell';

	// Minimum buffer cell height. Azért van rá szükség, mert ha nincs megadva, akkor ugrik egyett a scroll ha a végére vagy az elejére értünk a táblázatban
	config.inner.minCellHeight = 2;

	// Az offset miatt kell a számoláshoz
	config.inner.tableHeightOffset = config.inner.minCellHeight * 2;
	config.inner.editedCells = [];
	config.inner.leftCellOffset = 0;
	config.inner.topCellOffset = 0;
}

function calculateVirtualContainerHeight(config, options) {
	var containerHeight = getInnerValue(options, 'dimensions.containerHeight');

	if (typeof containerHeight == 'undefined') {
		containerHeight = configUtil.getDefaultContainerHeight(config);
	}

	config.dimensions.containerHeight = configUtil.calculateVirtualContainerHeight(config, containerHeight);
}

function initInnerCalculatedValues(config) {
	config.inner.indexOfCellKeyHeader = configUtil.getIndexOfCellKeyHeader(config);
	config.inner.colspanOffset = configUtil.getMaxColspan(config);
	config.inner.visibleRowNumber = configUtil.getVisibleRowNumber(config);
	config.inner.visibleColumnNumber = configUtil.getVisibleColumnNumber(config);
	config.tableWidth = configUtil.getTableWidth(config);
	config.tableHeight = configUtil.getTableHeight(config);
}

function updateValue(config, options, key) {
	var target = getInnerObject(config, key), // eslint-disable-line no-unused-vars
		value = getInnerValue(options, key),
		keys = key.split('.'),
		lastKey = keys[keys.length - 1];

	if (typeof value == 'undefined') {
		target[lastKey] = typeof getInnerValue(DEFAULTS, key) == 'function' ? getInnerValue(DEFAULTS, key)(config) : getInnerValue(DEFAULTS, key);
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
},{"../utils/configuration":9,"../utils/generator":13}],6:[function(require,module,exports){
'use strict';

var configuration    = require('./configuration'),
	eventHandlerUtil = require('../utils/event-handler'),
	generatorUtil    = require('../utils/generator'),
	domUtil          = require('../utils/dom');

function generateTable(config, options) {
	configuration.init(config, options);

	generatorUtil.initTable(config);
	generatorUtil.initBuffers(config);

	domUtil.updateTable(config);

	eventHandlerUtil.addEvents(config);
}

function destroyTable(config) {
	eventHandlerUtil.removeEvents(config);
	domUtil.destroyTable(config);
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable
};
},{"../utils/dom":10,"../utils/event-handler":12,"../utils/generator":13,"./configuration":5}],7:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
'use strict';

var tableUtil = require('./table');

function indexOfElement(element) {
	var collection = element.parentNode.childNodes;

	for (var i = 0; i < collection.length; i++) {
		if (collection[i] === element) {
			return i;
		}
	}

	return -1;
}

function updateCell(config, cell, cellObj) {
	cell.innerHTML = cellObj.value;
	cell.className = config.inner.selectors.dataCell + ' ' + (cellObj.class || '');
}

function updateTable(config) {
	var countRow = 0,
		colspan = 1;

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.headerRow).forEach(function(row) {
		row.querySelectorAll('td.' + config.inner.selectors.headerCell).forEach(function(cell, cellNumber) {
			var cellObj = config.headers[countRow][config.inner.leftCellOffset + cellNumber];

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
				var calculatedColspan = config.inner.visibleColumnNumber <= cellNumber + cellObj.colspan ? config.inner.visibleColumnNumber - cellNumber : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
			}
		});
		countRow++;
		colspan = 1;
	});

	document.querySelectorAll('.' + config.selectors.virtualTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(config, cell, tableUtil.getCell(config, config.inner.topCellOffset + rowNumber, config.inner.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + config.selectors.fixedTable + ' tr.' + config.inner.selectors.dataRow).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + config.inner.selectors.dataCell).forEach(function(cell, cellNumber) {
			updateCell(config, cell, tableUtil.getFixedCell(config, config.inner.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(config, onInputBlurEventHandler) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(config.selectors.editingCell);
	});
}

function resetEditedCell(config) {
	document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.selectors.editingCell).forEach(function(editedCell) {
		editedCell.classList.remove(config.selectors.editedCell);
	});

	config.inner.editedCells = [];
	updateTable(config);
}

function destroyTable(config) {
	document.querySelector(config.selectors.mainContainer).innerHTML = '';
}

module.exports = {
	indexOfElement: indexOfElement,
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable
};
},{"./table":14}],11:[function(require,module,exports){
'use strict';

var EventArguments = require('../models/event-arguments'),
	tableUtil = require('./table'),
	domUtil   = require('./dom');

function saveCells(config) {
	if (!config.edit.enabled) {
		return;
	}

	var args = new EventArguments({
		cellObject: config.inner.editedCells,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeSave(args);

	if (!args.cancelEvent) {
		config.inner.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(config, cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell(config);

		config.eventHandlers.onAfterSave(args);
	}
}

module.exports = {
	saveCells: saveCells
};
},{"../models/event-arguments":3,"./dom":10,"./table":14}],12:[function(require,module,exports){
'use strict';

var EventArguments = require('../models/event-arguments');

var domUtil = require('../utils/dom'),
	tableUtil = require('../utils/table'),
	editUtil = require('../utils/edit'),
	generatorUtil = require('../utils/generator');

var container;

var instances = {
	onScrollEventHandler: function() {},
	onInputBlurEventHandler: function() {},
	onClickCellEventHandler: function() {},
	onClickSaveButtonEventHandler: function() {}
};

function onWheelEventHandler(event) {
	event.preventDefault();

	container.scrollTop += event.deltaY;
	container.scrollLeft += event.deltaX;
}

function onScrollEventHandler(event, config) {
	domUtil.resetEditingCell(config, instances.onInputBlurEventHandler);
	generatorUtil.initBuffers(config);
	domUtil.updateTable(config);
}

function onInputBlurEventHandler(event, config) {
	var cell = event.target.parentNode,
		rowNumber = domUtil.indexOfElement(cell.parentNode) + config.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + config.inner.leftCellOffset,
		editedObj = tableUtil.getCell(config, rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: event.target.value,
		class: config.selectors.editedCell
	});

	if (!tableUtil.isCellChanged(config, editedObj)) {
		domUtil.resetEditingCell(config, instances.onInputBlurEventHandler);

		return;
	}

	var args = new EventArguments({
		cell: cell,
		cellObject: editedObj,
		cancelEvent: false
	});

	config.eventHandlers.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(config, args.cellObject);
		domUtil.updateCell(config, args.cell, args.cellObject);

		config.eventHandlers.onAfterEdit(args);
	}
}

function onClickCellEventHandler(event, config) {
	if (!config.edit.enabled) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(event.target.parentNode) + config.inner.topCellOffset,
		columnNumber = domUtil.indexOfElement(event.target) - 1 + config.inner.leftCellOffset,
		editedObj = tableUtil.getCell(config, rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: event.target,
		cellObject: editedObj,
		cancelEvent: false
	});

	config.eventHandlers.onBeforeEdit(args);

	if (!args.cancelEvent) {
		event.target.classList.add(config.selectors.editingCell);
		event.target.classList.remove(config.selectors.editedCell);
		event.target.innerHTML = '';
		event.target.appendChild(input);

		instances.onInputBlurEventHandler = function(ev) { onInputBlurEventHandler(ev, config); };

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', instances.onInputBlurEventHandler);
	}
}

function onClickSaveButtonEventHandler(event, config) {
	editUtil.saveCells(config);
}

function addEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	instances.onScrollEventHandler = function(event) { onScrollEventHandler(event, config); };
	instances.onClickCellEventHandler = function(event) { onClickCellEventHandler(event, config); };
	instances.onClickSaveButtonEventHandler = function(event) { onClickSaveButtonEventHandler(event, config); };

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).addEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.addEventListener('click', instances.onClickCellEventHandler);
		});
	}
}

function removeEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	if (container !== null) {
		container.removeEventListener('wheel', onWheelEventHandler);
		container.removeEventListener('scroll', instances.onScrollEventHandler);
	}

	if (config.edit.enabled && config.selectors.saveButton !== null) {
		document.querySelector(config.selectors.saveButton).removeEventListener('click', instances.onClickSaveButtonEventHandler);
	}

	if (config.edit.enabled) {
		document.querySelectorAll('.' + config.selectors.virtualTable + ' td.' + config.inner.selectors.dataCell).forEach(function(el) {
			el.removeEventListener('click', instances.onClickCellEventHandler);
		});
	}
}

module.exports = {
	addEvents: addEvents,
	removeEvents: removeEvents
};
},{"../models/event-arguments":3,"../utils/dom":10,"../utils/edit":11,"../utils/generator":13,"../utils/table":14}],13:[function(require,module,exports){
'use strict';

function initContainers(config) {
	var container = document.querySelector(config.selectors.mainContainer),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(config.selectors.virtualContainer);
	virtualTable.classList.add(config.selectors.virtualTable);
	fixedContainer.classList.add(config.selectors.fixedContainer);
	fixedTable.classList.add(config.selectors.fixedTable);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = config.dimensions.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = config.inner.minCellHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(config) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr');

	trHeadBuffer.classList.add(config.inner.selectors.bufferRowTopClass);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(config.inner.selectors.bufferColumnLeft);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < config.inner.visibleColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(config.inner.selectors.bufferColumnRight);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	config.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trHead.appendChild(tdElement);

		for (j = 0; j < config.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.innerHTML = headerRow[j].text || headerRow[j].key || '';

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnRight);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual body
	for (i = 0; i < config.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnLeft);

		trBody.appendChild(tdElement);

		for (j = 0; j < config.inner.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(config.inner.selectors.bufferColumnRight);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(config.inner.selectors.bufferRowBottom);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + config.selectors.virtualTable).appendChild(virtualThead);
	document.querySelector('.' + config.selectors.virtualTable).appendChild(virtualTbody);

	config.inner.bufferLeft = document.querySelectorAll('.' + config.inner.selectors.bufferColumnLeft);
	config.inner.bufferRight = document.querySelectorAll('.' + config.inner.selectors.bufferColumnRight);
	config.inner.bufferTop = document.querySelectorAll('.' + config.inner.selectors.bufferRowTopClass);
	config.inner.bufferBottom = document.querySelectorAll('.' + config.inner.selectors.bufferRowBottom);

	// Generate fixed table

	if (config.fixedHeaders.length === 0) {
		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < config.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(config.inner.selectors.headerRow);
		trHead.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.headerCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';
			tdElement.innerHTML = config.fixedHeaders[i][j].text || config.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < config.inner.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(config.inner.selectors.dataRow);
		trBody.style.height = config.dimensions.cellHeight + 'px';

		for (j = 0; j < config.fixedHeaders[config.inner.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(config.inner.selectors.dataCell);
			tdElement.style.minWidth = config.dimensions.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedThead);
	document.querySelector('.' + config.selectors.fixedTable).appendChild(fixedTbody);
}

function initBuffers(config) {
	var left = document.querySelector('.' + config.selectors.virtualContainer).scrollLeft - document.querySelector('.' + config.selectors.virtualContainer).scrollLeft % config.dimensions.cellWidth - config.inner.colspanOffset * config.dimensions.cellWidth,
		right = config.tableWidth - left,
		top = document.querySelector('.' + config.selectors.virtualContainer).scrollTop,
		bottom = config.tableHeight - top;

	left = left > config.tableWidth ? config.tableWidth : left;
	left = left < 0 ? 0 : left;
	right = config.tableWidth - left;
	top = top + config.inner.minCellHeight > config.tableHeight ? config.tableHeight + config.inner.minCellHeight : top + config.inner.minCellHeight;
	bottom = config.tableHeight - top;

	config.inner.leftCellOffset = Math.floor(left / config.dimensions.cellWidth);
	config.inner.topCellOffset = Math.floor((top - top % config.dimensions.cellHeight) / config.dimensions.cellHeight);

	config.inner.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	config.inner.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	config.inner.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	config.inner.bufferBottom.forEach(function(el) {
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

function getCell(config, rowNumber, columnNumber) {
	var cellObj = config.inner.editedCells.find(function(el) {
			return el.rowNumber === rowNumber && el.columnNumber === columnNumber;
		}),
		rowObj = config.headers[config.inner.indexOfCellKeyHeader];

	if (typeof cellObj == 'undefined') {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: config.dataSource[rowNumber][rowObj[columnNumber].key]
		});

		cellObj.updateAttributes({
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});
	}

	return cellObj;
}

function getFixedCell(config, rowNumber, columnNumber) {
	var cellObj = null,
		rowObj = config.fixedHeaders[config.inner.indexOfCellKeyHeader];

	cellObj = new Cell({
		key: rowObj[columnNumber].key,
		value: config.dataSource[rowNumber][rowObj[columnNumber].key]
	});

	return cellObj;
}

function setCellValue(config, rowNumber, columnNumber, value) {
	var rowObj = config.headers[config.inner.indexOfCellKeyHeader];

	config.dataSource[rowNumber][rowObj[columnNumber].key] = value;
}

function isCellChanged(config, cellObj) {
	var originalObj = getCell(config, cellObj.rowNumber, cellObj.columnNumber),
		editedObj = config.inner.editedCells.find(function(el) {
			return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
		}),
		originalVal = originalObj.value || '';

	return originalVal !== cellObj.value || typeof editedObj != 'undefined';
}

function setUpdatedCellValue(config, cellObj) {
	var prev = config.inner.editedCells.find(function(el) {
		return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
	});

	if (typeof prev == 'undefined') {
		config.inner.editedCells.push(cellObj);
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
},{"../models/cell":2}]},{},[1]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJy4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzJyk7cmVxdWlyZSgnLi9wb2xseWZpbGxzL05vZGVMaXN0LmZvckVhY2guanMnKTtcblxudmFyIFZpcnR1YWxEYXRhR3JpZCA9IHJlcXVpcmUoJy4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkJyk7XG5cbndpbmRvdy5WaXJ0dWFsRGF0YUdyaWQgPSBWaXJ0dWFsRGF0YUdyaWQ7XG59LHtcIi4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkXCI6NCxcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NyxcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6OH1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsT2JqZWN0KHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdrZXknKTtcblx0aW5pdEF0dHIoJ3ZhbHVlJyk7XG5cdGluaXRBdHRyKCdjbGFzcycpO1xuXHRpbml0QXR0cigncm93TnVtYmVyJyk7XG5cdGluaXRBdHRyKCdjb2x1bW5OdW1iZXInKTtcblxuXHRmdW5jdGlvbiBpbml0QXR0cihuYW1lKSB7XG5cdFx0c2VsZltuYW1lXSA9IHR5cGVvZiBwID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBwW25hbWVdID09ICd1bmRlZmluZWQnID8gbnVsbCA6IHBbbmFtZV07XG5cdH1cblxuXHR0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycykge1xuXHRcdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcblx0XHRcdGlmICh0eXBlb2YgYXR0cnNba10gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGZba10gIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0c2VsZltrXSA9IGF0dHJzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxPYmplY3Q7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRBcmd1bWVudHMocCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aW5pdEF0dHIoJ2NlbGwnKTtcblx0aW5pdEF0dHIoJ2NlbGxPYmplY3QnKTtcblx0aW5pdEF0dHIoJ2NhbmNlbEV2ZW50Jyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEFyZ3VtZW50cztcbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9nZW5lcmF0b3InKTtcblxudmFyIHVuaXF1ZUlkU2VxdWVuY2UgPSAxO1xuXG5mdW5jdGlvbiBWaXJ0dWFsRGF0YUdyaWQoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmNvbmZpZ3VyYXRpb24gPSB7fTtcblx0c2VsZi51bmlxdWVJZCA9IHVuaXF1ZUlkU2VxdWVuY2UrKztcblx0c2VsZi5nZW5lcmF0ZVRhYmxlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdGdlbmVyYXRvci5nZW5lcmF0ZVRhYmxlKHNlbGYuY29uZmlndXJhdGlvbiwgb3B0aW9ucyk7XG5cdH07XG5cdHNlbGYuZGVzdHJveVRhYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0Z2VuZXJhdG9yLmRlc3Ryb3lUYWJsZShzZWxmLmNvbmZpZ3VyYXRpb24pO1xuXHR9O1xuXHRzZWxmLmdldElkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlbGYudW5pcXVlSWQ7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbERhdGFHcmlkO1xufSx7XCIuLi9tb2R1bGVzL2dlbmVyYXRvclwiOjZ9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ1V0aWwgPSByZXF1aXJlKCcuLi91dGlscy9jb25maWd1cmF0aW9uJyksXG5cdGdlbmVyYXRvclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKTtcblxudmFyIERFRkFVTFRTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRtYWluQ29udGFpbmVyOiAnLmRhdGEtY29udGFpbmVyJyxcblx0XHRmaXhlZENvbnRhaW5lcjogJ2ZpeGVkLWNvbnRhaW5lcicsXG5cdFx0Zml4ZWRUYWJsZTogJ2ZpeGVkLXRhYmxlJyxcblx0XHR2aXJ0dWFsQ29udGFpbmVyOiAndmlydHVhbC1jb250YWluZXInLFxuXHRcdHZpcnR1YWxUYWJsZTogJ3ZpcnR1YWwtdGFibGUnLFxuXHRcdGVkaXRpbmdDZWxsOiAnZWRpdGluZy1jZWxsJyxcblx0XHRlZGl0ZWRDZWxsOiAnZWRpdGVkLWNlbGwnLFxuXHRcdHNhdmVCdXR0b246IG51bGxcblx0fSxcblx0ZGltZW5zaW9uczoge1xuXHRcdGNlbGxXaWR0aDogMTUwLFxuXHRcdGNlbGxIZWlnaHQ6IDUwLFxuXHRcdGNvbnRhaW5lckhlaWdodDogY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHR9LFxuXHRlZGl0OiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0ZXZlbnRIYW5kbGVyczoge1xuXHRcdG9uQmVmb3JlRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25WYWxpZGF0aW9uOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25CZWZvcmVTYXZlOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyU2F2ZTogY29uZmlnVXRpbC5uaWxcblx0fSxcblx0ZGF0YVNvdXJjZTogWyB7fSBdLFxuXHRoZWFkZXJzOiBbIFsge30gXSBdLFxuXHRmaXhlZEhlYWRlcnM6IFsgWyB7fSBdIF0sXG5cdGlubmVyOiB7fVxufTtcblxuZnVuY3Rpb24gaW5pdChjb25maWcsIG9wdGlvbnMpIHtcblx0aW5pdENvbmZpZ09iamVjdChjb25maWcpO1xuXHRpbml0SW5uZXJTdGF0aWNWYWx1ZXMoY29uZmlnKTtcblxuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMubWFpbkNvbnRhaW5lcicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMuZml4ZWRDb250YWluZXInKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLmZpeGVkVGFibGUnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXInKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLnZpcnR1YWxUYWJsZScpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMuZWRpdGluZ0NlbGwnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLmVkaXRlZENlbGwnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLnNhdmVCdXR0b24nKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZGltZW5zaW9ucy5jZWxsV2lkdGgnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZGltZW5zaW9ucy5jZWxsSGVpZ2h0Jyk7XG5cblx0Y2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIG9wdGlvbnMpO1xuXG5cdGdlbmVyYXRvclV0aWwuaW5pdENvbnRhaW5lcnMoY29uZmlnKTtcblxuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdkYXRhU291cmNlJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2hlYWRlcnMnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZml4ZWRIZWFkZXJzJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2VkaXQuZW5hYmxlZCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uQmVmb3JlRWRpdCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uVmFsaWRhdGlvbicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uQWZ0ZXJFZGl0Jyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25CZWZvcmVTYXZlJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25BZnRlclNhdmUnKTtcblxuXHRpbml0SW5uZXJDYWxjdWxhdGVkVmFsdWVzKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGluaXRDb25maWdPYmplY3QoY29uZmlnKSB7XG5cdGNvbmZpZy5zZWxlY3RvcnMgPSB7fTtcblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMgPSB7fTtcblx0Y29uZmlnLmlubmVyID0ge307XG5cdGNvbmZpZy5pbm5lci5zZWxlY3RvcnMgPSB7fTtcbn1cblxuZnVuY3Rpb24gaW5pdElubmVyU3RhdGljVmFsdWVzKGNvbmZpZykge1xuXHRjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcCA9ICdidWZmZXItcm93LXRvcCc7XG5cdGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tID0gJ2J1ZmZlci1yb3ctYm90dG9tJztcblx0Y29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0ID0gJ2J1ZmZlci1jb2x1bW4tbGVmdCc7XG5cdGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQgPSAnYnVmZmVyLWNvbHVtbi1yaWdodCc7XG5cdGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93ID0gJ2hlYWRlci1yb3cnO1xuXHRjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwgPSAnaGVhZGVyLWNlbGwnO1xuXHRjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFSb3cgPSAnZGF0YS1yb3cnO1xuXHRjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsID0gJ2RhdGEtY2VsbCc7XG5cblx0Ly8gTWluaW11bSBidWZmZXIgY2VsbCBoZWlnaHQuIEF6w6lydCB2YW4gcsOhIHN6w7xrc8OpZywgbWVydCBoYSBuaW5jcyBtZWdhZHZhLCBha2tvciB1Z3JpayBlZ3lldHQgYSBzY3JvbGwgaGEgYSB2w6lnw6lyZSB2YWd5IGF6IGVsZWrDqXJlIMOpcnTDvG5rIGEgdMOhYmzDoXphdGJhblxuXHRjb25maWcuaW5uZXIubWluQ2VsbEhlaWdodCA9IDI7XG5cblx0Ly8gQXogb2Zmc2V0IG1pYXR0IGtlbGwgYSBzesOhbW9sw6FzaG96XG5cdGNvbmZpZy5pbm5lci50YWJsZUhlaWdodE9mZnNldCA9IGNvbmZpZy5pbm5lci5taW5DZWxsSGVpZ2h0ICogMjtcblx0Y29uZmlnLmlubmVyLmVkaXRlZENlbGxzID0gW107XG5cdGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCA9IDA7XG5cdGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ID0gMDtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIG9wdGlvbnMpIHtcblx0dmFyIGNvbnRhaW5lckhlaWdodCA9IGdldElubmVyVmFsdWUob3B0aW9ucywgJ2RpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0Jyk7XG5cblx0aWYgKHR5cGVvZiBjb250YWluZXJIZWlnaHQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRjb250YWluZXJIZWlnaHQgPSBjb25maWdVdGlsLmdldERlZmF1bHRDb250YWluZXJIZWlnaHQoY29uZmlnKTtcblx0fVxuXG5cdGNvbmZpZy5kaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCA9IGNvbmZpZ1V0aWwuY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIGNvbnRhaW5lckhlaWdodCk7XG59XG5cbmZ1bmN0aW9uIGluaXRJbm5lckNhbGN1bGF0ZWRWYWx1ZXMoY29uZmlnKSB7XG5cdGNvbmZpZy5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlciA9IGNvbmZpZ1V0aWwuZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIoY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLmNvbHNwYW5PZmZzZXQgPSBjb25maWdVdGlsLmdldE1heENvbHNwYW4oY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXIgPSBjb25maWdVdGlsLmdldFZpc2libGVSb3dOdW1iZXIoY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIgPSBjb25maWdVdGlsLmdldFZpc2libGVDb2x1bW5OdW1iZXIoY29uZmlnKTtcblx0Y29uZmlnLnRhYmxlV2lkdGggPSBjb25maWdVdGlsLmdldFRhYmxlV2lkdGgoY29uZmlnKTtcblx0Y29uZmlnLnRhYmxlSGVpZ2h0ID0gY29uZmlnVXRpbC5nZXRUYWJsZUhlaWdodChjb25maWcpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsIGtleSkge1xuXHR2YXIgdGFyZ2V0ID0gZ2V0SW5uZXJPYmplY3QoY29uZmlnLCBrZXkpLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cdFx0dmFsdWUgPSBnZXRJbm5lclZhbHVlKG9wdGlvbnMsIGtleSksXG5cdFx0a2V5cyA9IGtleS5zcGxpdCgnLicpLFxuXHRcdGxhc3RLZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAndW5kZWZpbmVkJykge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHR5cGVvZiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpID09ICdmdW5jdGlvbicgPyBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpKGNvbmZpZykgOiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpO1xuXHR9IGVsc2Uge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHZhbHVlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldElubmVyT2JqZWN0KG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblxuXHR2YXIgc3ViS2V5ID0ga2V5LnNwbGl0KCcuJylbMF0sXG5cdFx0c3ViT2JqZWN0ID0gb2JqZWN0W3N1YktleV07XG5cblx0aWYgKHR5cGVvZiBzdWJPYmplY3QgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRvYmplY3Rbc3ViS2V5XSA9IHt9O1xuXHRcdHN1Yk9iamVjdCA9IG9iamVjdFtzdWJLZXldO1xuXHR9XG5cblx0cmV0dXJuIGdldElubmVyT2JqZWN0KHN1Yk9iamVjdCwga2V5LnN1YnN0cmluZyhrZXkuaW5kZXhPZignLicpICsgMSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbm5lclZhbHVlKG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Rba2V5XTtcblx0fVxuXG5cdHZhciBzdWJLZXkgPSBrZXkuc3BsaXQoJy4nKVswXSxcblx0XHRzdWJPYmplY3QgPSBvYmplY3Rbc3ViS2V5XTtcblxuXHRpZiAodHlwZW9mIHN1Yk9iamVjdCA9PSAndW5kZWZpbmVkJykge1xuXHRcdHJldHVybiBzdWJPYmplY3Q7XG5cdH1cblxuXHRyZXR1cm4gZ2V0SW5uZXJWYWx1ZShzdWJPYmplY3QsIGtleS5zdWJzdHJpbmcoa2V5LmluZGV4T2YoJy4nKSArIDEpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IGluaXQsXG5cdHVwZGF0ZVZhbHVlOiB1cGRhdGVWYWx1ZVxufTtcbn0se1wiLi4vdXRpbHMvY29uZmlndXJhdGlvblwiOjksXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxM31dLDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uZmlndXJhdGlvbiAgICA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbicpLFxuXHRldmVudEhhbmRsZXJVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZXZlbnQtaGFuZGxlcicpLFxuXHRnZW5lcmF0b3JVdGlsICAgID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2VuZXJhdG9yJyksXG5cdGRvbVV0aWwgICAgICAgICAgPSByZXF1aXJlKCcuLi91dGlscy9kb20nKTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVUYWJsZShjb25maWcsIG9wdGlvbnMpIHtcblx0Y29uZmlndXJhdGlvbi5pbml0KGNvbmZpZywgb3B0aW9ucyk7XG5cblx0Z2VuZXJhdG9yVXRpbC5pbml0VGFibGUoY29uZmlnKTtcblx0Z2VuZXJhdG9yVXRpbC5pbml0QnVmZmVycyhjb25maWcpO1xuXG5cdGRvbVV0aWwudXBkYXRlVGFibGUoY29uZmlnKTtcblxuXHRldmVudEhhbmRsZXJVdGlsLmFkZEV2ZW50cyhjb25maWcpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95VGFibGUoY29uZmlnKSB7XG5cdGV2ZW50SGFuZGxlclV0aWwucmVtb3ZlRXZlbnRzKGNvbmZpZyk7XG5cdGRvbVV0aWwuZGVzdHJveVRhYmxlKGNvbmZpZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZW5lcmF0ZVRhYmxlOiBnZW5lcmF0ZVRhYmxlLFxuXHRkZXN0cm95VGFibGU6IGRlc3Ryb3lUYWJsZVxufTtcbn0se1wiLi4vdXRpbHMvZG9tXCI6MTAsXCIuLi91dGlscy9ldmVudC1oYW5kbGVyXCI6MTIsXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxMyxcIi4vY29uZmlndXJhdGlvblwiOjV9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuaWYgKHR5cGVvZiBBcnJheS5wcm90b3R5cGUuZmluZCA9PSAndW5kZWZpbmVkJykge1xuXHRBcnJheS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dGVuZC1uYXRpdmVcblx0XHRpZiAodGhpcyA9PT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLmZpbmQgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cblx0XHR2YXIgbGlzdCA9IE9iamVjdCh0aGlzKTtcblx0XHR2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG5cdFx0dmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG5cdFx0dmFyIHZhbHVlO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0dmFsdWUgPSBsaXN0W2ldO1xuXHRcdFx0aWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0KSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZmluZWRcblx0fTtcbn1cbn0se31dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIU5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoKSB7XG5cdE5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIGFyZ3VtZW50KSB7XG5cdFx0YXJndW1lbnQgPSBhcmd1bWVudCB8fCB3aW5kb3c7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoYXJndW1lbnQsIHRoaXNbaV0sIGksIHRoaXMpO1xuXHRcdH1cblx0fTtcbn1cbn0se31dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGNvbmZpZywgaGVpZ2h0KSB7XG5cdGlmICh0eXBlb2YgaGVpZ2h0ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0cmV0dXJuIGhlaWdodDtcblx0fVxuXG5cdHJldHVybiBjb25maWcuaW5uZXIudGFibGVIZWlnaHRPZmZzZXQgKyBNYXRoLmZsb29yKGhlaWdodCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQpICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodChjb25maWcpIHtcblx0cmV0dXJuIGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoY29uZmlnLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbmZpZy5zZWxlY3RvcnMubWFpbkNvbnRhaW5lcikuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gNjQpO1xufVxuXG5mdW5jdGlvbiBnZXRJbmRleE9mQ2VsbEtleUhlYWRlcihjb25maWcpIHtcblx0cmV0dXJuIGNvbmZpZy5oZWFkZXJzLmxlbmd0aCAtIDE7XG59XG5cbmZ1bmN0aW9uIGdldE1heENvbHNwYW4oY29uZmlnKSB7XG5cdHZhciBtYXhWYWwgPSAwO1xuXG5cdGNvbmZpZy5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdGVsZW1lbnQuZm9yRWFjaChmdW5jdGlvbihzdWJFbGVtZW50KSB7XG5cdFx0XHRpZiAodHlwZW9mIHN1YkVsZW1lbnQuY29sc3BhbiAhPSAndW5kZWZpbmVkJyAmJiBtYXhWYWwgPCBzdWJFbGVtZW50LmNvbHNwYW4pIHtcblx0XHRcdFx0bWF4VmFsID0gc3ViRWxlbWVudC5jb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHRyZXR1cm4gbWF4VmFsO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlUm93TnVtYmVyKGNvbmZpZykge1xuXHRyZXR1cm4gTWF0aC5mbG9vcigoY29uZmlnLmRpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0IC0gY29uZmlnLmlubmVyLnRhYmxlSGVpZ2h0T2Zmc2V0KSAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQpIC0gY29uZmlnLmhlYWRlcnMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlQ29sdW1uTnVtYmVyKGNvbmZpZykge1xuXHRyZXR1cm4gTWF0aC5mbG9vcihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikub2Zmc2V0V2lkdGggLyBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggK1xuXHRcdChjb25maWcuaW5uZXIuY29sc3Bhbk9mZnNldCA+IDIgPyBjb25maWcuaW5uZXIuY29sc3Bhbk9mZnNldCA6IDIpICsgY29uZmlnLmlubmVyLmNvbHNwYW5PZmZzZXQpO1xufVxuXG5mdW5jdGlvbiBnZXRUYWJsZVdpZHRoKGNvbmZpZykge1xuXHRyZXR1cm4gKGNvbmZpZy5oZWFkZXJzW2NvbmZpZy5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl0ubGVuZ3RoIC0gY29uZmlnLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIpICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoO1xufVxuXG5mdW5jdGlvbiBnZXRUYWJsZUhlaWdodChjb25maWcpIHtcblx0cmV0dXJuIChjb25maWcuZGF0YVNvdXJjZS5sZW5ndGggLSBjb25maWcuaW5uZXIudmlzaWJsZVJvd051bWJlciArIDEpICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gbmlsKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQ6IGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQsXG5cdGdldERlZmF1bHRDb250YWluZXJIZWlnaHQ6IGdldERlZmF1bHRDb250YWluZXJIZWlnaHQsXG5cdGdldEluZGV4T2ZDZWxsS2V5SGVhZGVyOiBnZXRJbmRleE9mQ2VsbEtleUhlYWRlcixcblx0Z2V0TWF4Q29sc3BhbjogZ2V0TWF4Q29sc3Bhbixcblx0Z2V0VmlzaWJsZVJvd051bWJlcjogZ2V0VmlzaWJsZVJvd051bWJlcixcblx0Z2V0VmlzaWJsZUNvbHVtbk51bWJlcjogZ2V0VmlzaWJsZUNvbHVtbk51bWJlcixcblx0Z2V0VGFibGVXaWR0aDogZ2V0VGFibGVXaWR0aCxcblx0Z2V0VGFibGVIZWlnaHQ6IGdldFRhYmxlSGVpZ2h0LFxuXHRuaWw6IG5pbFxufTtcbn0se31dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHRhYmxlVXRpbCA9IHJlcXVpcmUoJy4vdGFibGUnKTtcblxuZnVuY3Rpb24gaW5kZXhPZkVsZW1lbnQoZWxlbWVudCkge1xuXHR2YXIgY29sbGVjdGlvbiA9IGVsZW1lbnQucGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChjb2xsZWN0aW9uW2ldID09PSBlbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNlbGwoY29uZmlnLCBjZWxsLCBjZWxsT2JqKSB7XG5cdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai52YWx1ZTtcblx0Y2VsbC5jbGFzc05hbWUgPSBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsICsgJyAnICsgKGNlbGxPYmouY2xhc3MgfHwgJycpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVUYWJsZShjb25maWcpIHtcblx0dmFyIGNvdW50Um93ID0gMCxcblx0XHRjb2xzcGFuID0gMTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ci4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpLmZvckVhY2goZnVuY3Rpb24ocm93KSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dmFyIGNlbGxPYmogPSBjb25maWcuaGVhZGVyc1tjb3VudFJvd11bY29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcl07XG5cblx0XHRcdGlmIChjb2xzcGFuID4gMSkge1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGNvbHNwYW4tLTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai50ZXh0IHx8IGNlbGxPYmoua2V5IHx8ICcnO1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAndGFibGUtY2VsbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgY2VsbE9iai5jb2xzcGFuID09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNlbGwucmVtb3ZlQXR0cmlidXRlKCdjb2xzcGFuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2FsY3VsYXRlZENvbHNwYW4gPSBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlciA8PSBjZWxsTnVtYmVyICsgY2VsbE9iai5jb2xzcGFuID8gY29uZmlnLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIgLSBjZWxsTnVtYmVyIDogY2VsbE9iai5jb2xzcGFuO1xuXG5cdFx0XHRcdGNlbGwuc2V0QXR0cmlidXRlKCdjb2xzcGFuJywgY2FsY3VsYXRlZENvbHNwYW4pO1xuXHRcdFx0XHRjb2xzcGFuID0gY2FsY3VsYXRlZENvbHNwYW47XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Y291bnRSb3crKztcblx0XHRjb2xzcGFuID0gMTtcblx0fSk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdykuZm9yRWFjaChmdW5jdGlvbihyb3csIHJvd051bWJlcikge1xuXHRcdHJvdy5xdWVyeVNlbGVjdG9yQWxsKCd0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR1cGRhdGVDZWxsKGNvbmZpZywgY2VsbCwgdGFibGVVdGlsLmdldENlbGwoY29uZmlnLCBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCArIHJvd051bWJlciwgY29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcikpO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSArICcgdHIuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdykuZm9yRWFjaChmdW5jdGlvbihyb3csIHJvd051bWJlcikge1xuXHRcdHJvdy5xdWVyeVNlbGVjdG9yQWxsKCd0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR1cGRhdGVDZWxsKGNvbmZpZywgY2VsbCwgdGFibGVVdGlsLmdldEZpeGVkQ2VsbChjb25maWcsIGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjZWxsTnVtYmVyKSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgb25JbnB1dEJsdXJFdmVudEhhbmRsZXIpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdGQuJyArIGNvbmZpZy5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpLmZvckVhY2goZnVuY3Rpb24oZWRpdGluZ0NlbGwpIHtcblx0XHR2YXIgaW5wdXQgPSBlZGl0aW5nQ2VsbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuXG5cdFx0aW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0XHRlZGl0aW5nQ2VsbC5pbm5lckhUTUwgPSBpbnB1dC52YWx1ZTtcblx0XHRlZGl0aW5nQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRFZGl0ZWRDZWxsKGNvbmZpZykge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlZGl0ZWRDZWxsKSB7XG5cdFx0ZWRpdGVkQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdH0pO1xuXG5cdGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscyA9IFtdO1xuXHR1cGRhdGVUYWJsZShjb25maWcpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95VGFibGUoY29uZmlnKSB7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnLnNlbGVjdG9ycy5tYWluQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluZGV4T2ZFbGVtZW50OiBpbmRleE9mRWxlbWVudCxcblx0dXBkYXRlQ2VsbDogdXBkYXRlQ2VsbCxcblx0dXBkYXRlVGFibGU6IHVwZGF0ZVRhYmxlLFxuXHRyZXNldEVkaXRpbmdDZWxsOiByZXNldEVkaXRpbmdDZWxsLFxuXHRyZXNldEVkaXRlZENlbGw6IHJlc2V0RWRpdGVkQ2VsbCxcblx0ZGVzdHJveVRhYmxlOiBkZXN0cm95VGFibGVcbn07XG59LHtcIi4vdGFibGVcIjoxNH1dLDExOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50QXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50cycpLFxuXHR0YWJsZVV0aWwgPSByZXF1aXJlKCcuL3RhYmxlJyksXG5cdGRvbVV0aWwgICA9IHJlcXVpcmUoJy4vZG9tJyk7XG5cbmZ1bmN0aW9uIHNhdmVDZWxscyhjb25maWcpIHtcblx0aWYgKCFjb25maWcuZWRpdC5lbmFibGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGFyZ3MgPSBuZXcgRXZlbnRBcmd1bWVudHMoe1xuXHRcdGNlbGxPYmplY3Q6IGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscyxcblx0XHRjYW5jZWxFdmVudDogZmFsc2Vcblx0fSk7XG5cblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25CZWZvcmVTYXZlKGFyZ3MpO1xuXG5cdGlmICghYXJncy5jYW5jZWxFdmVudCkge1xuXHRcdGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdHRhYmxlVXRpbC5zZXRDZWxsVmFsdWUoY29uZmlnLCBjZWxsLnJvd051bWJlciwgY2VsbC5jb2x1bW5OdW1iZXIsIGNlbGwudmFsdWUpO1xuXHRcdH0pO1xuXHRcdGRvbVV0aWwucmVzZXRFZGl0ZWRDZWxsKGNvbmZpZyk7XG5cblx0XHRjb25maWcuZXZlbnRIYW5kbGVycy5vbkFmdGVyU2F2ZShhcmdzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2F2ZUNlbGxzOiBzYXZlQ2VsbHNcbn07XG59LHtcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjozLFwiLi9kb21cIjoxMCxcIi4vdGFibGVcIjoxNH1dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50QXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50cycpO1xuXG52YXIgZG9tVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2RvbScpLFxuXHR0YWJsZVV0aWwgPSByZXF1aXJlKCcuLi91dGlscy90YWJsZScpLFxuXHRlZGl0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2VkaXQnKSxcblx0Z2VuZXJhdG9yVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpO1xuXG52YXIgY29udGFpbmVyO1xuXG52YXIgaW5zdGFuY2VzID0ge1xuXHRvblNjcm9sbEV2ZW50SGFuZGxlcjogZnVuY3Rpb24oKSB7fSxcblx0b25JbnB1dEJsdXJFdmVudEhhbmRsZXI6IGZ1bmN0aW9uKCkge30sXG5cdG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyOiBmdW5jdGlvbigpIHt9LFxuXHRvbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcjogZnVuY3Rpb24oKSB7fVxufTtcblxuZnVuY3Rpb24gb25XaGVlbEV2ZW50SGFuZGxlcihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdGNvbnRhaW5lci5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZO1xuXHRjb250YWluZXIuc2Nyb2xsTGVmdCArPSBldmVudC5kZWx0YVg7XG59XG5cbmZ1bmN0aW9uIG9uU2Nyb2xsRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpIHtcblx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0Z2VuZXJhdG9yVXRpbC5pbml0QnVmZmVycyhjb25maWcpO1xuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpIHtcblx0dmFyIGNlbGwgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZSxcblx0XHRyb3dOdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwucGFyZW50Tm9kZSkgKyBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwpIC0gMSArIGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCxcblx0XHRlZGl0ZWRPYmogPSB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyKTtcblxuXHRlZGl0ZWRPYmoudXBkYXRlQXR0cmlidXRlcyh7XG5cdFx0dmFsdWU6IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRjbGFzczogY29uZmlnLnNlbGVjdG9ycy5lZGl0ZWRDZWxsXG5cdH0pO1xuXG5cdGlmICghdGFibGVVdGlsLmlzQ2VsbENoYW5nZWQoY29uZmlnLCBlZGl0ZWRPYmopKSB7XG5cdFx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsOiBjZWxsLFxuXHRcdGNlbGxPYmplY3Q6IGVkaXRlZE9iaixcblx0XHRjYW5jZWxFdmVudDogZmFsc2Vcblx0fSk7XG5cblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25WYWxpZGF0aW9uKGFyZ3MpO1xuXG5cdGlmIChhcmdzLmNhbmNlbEVkaXQgIT09IHRydWUpIHtcblx0XHR0YWJsZVV0aWwuc2V0VXBkYXRlZENlbGxWYWx1ZShjb25maWcsIGFyZ3MuY2VsbE9iamVjdCk7XG5cdFx0ZG9tVXRpbC51cGRhdGVDZWxsKGNvbmZpZywgYXJncy5jZWxsLCBhcmdzLmNlbGxPYmplY3QpO1xuXG5cdFx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25BZnRlckVkaXQoYXJncyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DbGlja0NlbGxFdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZykge1xuXHRpZiAoIWNvbmZpZy5lZGl0LmVuYWJsZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgcm93TnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChldmVudC50YXJnZXQucGFyZW50Tm9kZSkgKyBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGV2ZW50LnRhcmdldCkgLSAxICsgY29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0LFxuXHRcdGVkaXRlZE9iaiA9IHRhYmxlVXRpbC5nZXRDZWxsKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpLFxuXHRcdGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuXHRpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsOiBldmVudC50YXJnZXQsXG5cdFx0Y2VsbE9iamVjdDogZWRpdGVkT2JqLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWcuZXZlbnRIYW5kbGVycy5vbkJlZm9yZUVkaXQoYXJncyk7XG5cblx0aWYgKCFhcmdzLmNhbmNlbEV2ZW50KSB7XG5cdFx0ZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCk7XG5cdFx0ZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoY29uZmlnLnNlbGVjdG9ycy5lZGl0ZWRDZWxsKTtcblx0XHRldmVudC50YXJnZXQuaW5uZXJIVE1MID0gJyc7XG5cdFx0ZXZlbnQudGFyZ2V0LmFwcGVuZENoaWxkKGlucHV0KTtcblxuXHRcdGluc3RhbmNlcy5vbklucHV0Qmx1ckV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7IG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKGV2LCBjb25maWcpOyB9O1xuXG5cdFx0aW5wdXQuZm9jdXMoKTtcblx0XHRpbnB1dC52YWx1ZSA9IGVkaXRlZE9iai52YWx1ZTtcblx0XHRpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0fVxufVxuXG5mdW5jdGlvbiBvbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKSB7XG5cdGVkaXRVdGlsLnNhdmVDZWxscyhjb25maWcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudHMoY29uZmlnKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKTtcblxuXHRpbnN0YW5jZXMub25TY3JvbGxFdmVudEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkgeyBvblNjcm9sbEV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKTsgfTtcblx0aW5zdGFuY2VzLm9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHsgb25DbGlja0NlbGxFdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZyk7IH07XG5cdGluc3RhbmNlcy5vbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7IG9uQ2xpY2tTYXZlQnV0dG9uRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpOyB9O1xuXG5cdGlmIChjb250YWluZXIgIT09IG51bGwpIHtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBvbldoZWVsRXZlbnRIYW5kbGVyLCB7IHBhc3NpdmU6IGZhbHNlLCBjYXB0dXJlOiB0cnVlIH0pO1xuXHRcdGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBpbnN0YW5jZXMub25TY3JvbGxFdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZy5lZGl0LmVuYWJsZWQgJiYgY29uZmlnLnNlbGVjdG9ycy5zYXZlQnV0dG9uICE9PSBudWxsKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLnNhdmVCdXR0b24pLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5zdGFuY2VzLm9uQ2xpY2tTYXZlQnV0dG9uRXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGlmIChjb25maWcuZWRpdC5lbmFibGVkKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdGQuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5zdGFuY2VzLm9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudHMoY29uZmlnKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlcik7XG5cdFx0Y29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGluc3RhbmNlcy5vblNjcm9sbEV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRpZiAoY29uZmlnLmVkaXQuZW5hYmxlZCAmJiBjb25maWcuc2VsZWN0b3JzLnNhdmVCdXR0b24gIT09IG51bGwpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbmZpZy5zZWxlY3RvcnMuc2F2ZUJ1dHRvbikucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbnN0YW5jZXMub25DbGlja1NhdmVCdXR0b25FdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZy5lZGl0LmVuYWJsZWQpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbnN0YW5jZXMub25DbGlja0NlbGxFdmVudEhhbmRsZXIpO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRhZGRFdmVudHM6IGFkZEV2ZW50cyxcblx0cmVtb3ZlRXZlbnRzOiByZW1vdmVFdmVudHNcbn07XG59LHtcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjozLFwiLi4vdXRpbHMvZG9tXCI6MTAsXCIuLi91dGlscy9lZGl0XCI6MTEsXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxMyxcIi4uL3V0aWxzL3RhYmxlXCI6MTR9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaXRDb250YWluZXJzKGNvbmZpZykge1xuXHR2YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLm1haW5Db250YWluZXIpLFxuXHRcdHZpcnR1YWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHR2aXJ0dWFsVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuXHRcdGZpeGVkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0Zml4ZWRUYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XG5cblx0dmlydHVhbENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcik7XG5cdHZpcnR1YWxUYWJsZS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKTtcblx0Zml4ZWRDb250YWluZXIuY2xhc3NMaXN0LmFkZChjb25maWcuc2VsZWN0b3JzLmZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRUYWJsZS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsQ29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxUYWJsZSk7XG5cblx0dmlydHVhbENvbnRhaW5lci5zdHlsZS5tYXhIZWlnaHQgPSBjb25maWcuZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQgKyAncHgnO1xuXHR2aXJ0dWFsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cblx0Zml4ZWRDb250YWluZXIuc3R5bGUucGFkZGluZyA9IGNvbmZpZy5pbm5lci5taW5DZWxsSGVpZ2h0ICsgJ3B4IDAnO1xuXHRmaXhlZENvbnRhaW5lci5zdHlsZS5mbG9hdCA9ICdsZWZ0Jztcbn1cblxuZnVuY3Rpb24gaW5pdFRhYmxlKGNvbmZpZykge1xuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIHRhYmxlXG5cdHZhciB2aXJ0dWFsVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdHZpcnR1YWxUYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rib2R5JyksXG5cdFx0dHJIZWFkQnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuXHR0ckhlYWRCdWZmZXIuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblxuXHR2YXIgaSwgaiwgdHJIZWFkLCB0ckJvZHksIGJ1ZmZlckNvbHVtbkxlZnQsIGJ1ZmZlckNvbHVtblJpZ2h0LCBidWZmZXJSb3dCb3R0b20sIHRkRWxlbWVudDtcblxuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIGhlYWRlclxuXHRidWZmZXJDb2x1bW5MZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0YnVmZmVyQ29sdW1uTGVmdC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKGJ1ZmZlckNvbHVtbkxlZnQpO1xuXG5cdGZvciAoaSA9IDA7IGkgPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaSsrKSB7XG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXHRcdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHR9XG5cblx0YnVmZmVyQ29sdW1uUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5SaWdodC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZChidWZmZXJDb2x1bW5SaWdodCk7XG5cblx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZEJ1ZmZlcik7XG5cblx0Y29uZmlnLmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXJSb3cpIHtcblx0XHR0ckhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRySGVhZC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93KTtcblx0XHR0ckhlYWQuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJDZWxsKTtcblx0XHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0XHR0ZEVsZW1lbnQuaW5uZXJIVE1MID0gaGVhZGVyUm93W2pdLnRleHQgfHwgaGVhZGVyUm93W2pdLmtleSB8fCAnJztcblxuXHRcdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH0pO1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgYm9keVxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQodHJCb2R5KTtcblx0fVxuXG5cdGJ1ZmZlclJvd0JvdHRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdGJ1ZmZlclJvd0JvdHRvbS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tKTtcblxuXHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQoYnVmZmVyUm93Qm90dG9tKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGhlYWQpO1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGJvZHkpO1xuXG5cdGNvbmZpZy5pbm5lci5idWZmZXJMZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyUmlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlckJvdHRvbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dCb3R0b20pO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIHRhYmxlXG5cblx0aWYgKGNvbmZpZy5maXhlZEhlYWRlcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGZpeGVkVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdGZpeGVkVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGhlYWRlclxuXG5cdGZvciAoaSA9IDA7IGkgPCBjb25maWcuZml4ZWRIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHJIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckhlYWQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlclJvdyk7XG5cdFx0dHJIZWFkLnN0eWxlLmhlaWdodCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGNvbmZpZy5maXhlZEhlYWRlcnNbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBjb25maWcuZml4ZWRIZWFkZXJzW2ldW2pdLnRleHQgfHwgY29uZmlnLmZpeGVkSGVhZGVyc1tpXVtqXS5rZXkgfHwgJyc7XG5cblx0XHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGZpeGVkVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkKTtcblx0fVxuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGJvZHlcblxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgY29uZmlnLmZpeGVkSGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRib2R5LmFwcGVuZENoaWxkKHRyQm9keSk7XG5cdH1cblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSkuYXBwZW5kQ2hpbGQoZml4ZWRUaGVhZCk7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy5maXhlZFRhYmxlKS5hcHBlbmRDaGlsZChmaXhlZFRib2R5KTtcbn1cblxuZnVuY3Rpb24gaW5pdEJ1ZmZlcnMoY29uZmlnKSB7XG5cdHZhciBsZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbExlZnQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikuc2Nyb2xsTGVmdCAlIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCAtIGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0ICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoLFxuXHRcdHJpZ2h0ID0gY29uZmlnLnRhYmxlV2lkdGggLSBsZWZ0LFxuXHRcdHRvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5zY3JvbGxUb3AsXG5cdFx0Ym90dG9tID0gY29uZmlnLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGxlZnQgPSBsZWZ0ID4gY29uZmlnLnRhYmxlV2lkdGggPyBjb25maWcudGFibGVXaWR0aCA6IGxlZnQ7XG5cdGxlZnQgPSBsZWZ0IDwgMCA/IDAgOiBsZWZ0O1xuXHRyaWdodCA9IGNvbmZpZy50YWJsZVdpZHRoIC0gbGVmdDtcblx0dG9wID0gdG9wICsgY29uZmlnLmlubmVyLm1pbkNlbGxIZWlnaHQgPiBjb25maWcudGFibGVIZWlnaHQgPyBjb25maWcudGFibGVIZWlnaHQgKyBjb25maWcuaW5uZXIubWluQ2VsbEhlaWdodCA6IHRvcCArIGNvbmZpZy5pbm5lci5taW5DZWxsSGVpZ2h0O1xuXHRib3R0b20gPSBjb25maWcudGFibGVIZWlnaHQgLSB0b3A7XG5cblx0Y29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcihsZWZ0IC8gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoKTtcblx0Y29uZmlnLmlubmVyLnRvcENlbGxPZmZzZXQgPSBNYXRoLmZsb29yKCh0b3AgLSB0b3AgJSBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KSAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQpO1xuXG5cdGNvbmZpZy5pbm5lci5idWZmZXJMZWZ0LmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5taW5XaWR0aCA9IGxlZnQgKyAncHgnO1xuXHR9KTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlclJpZ2h0LmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5taW5XaWR0aCA9IHJpZ2h0ICsgJ3B4Jztcblx0fSk7XG5cdGNvbmZpZy5pbm5lci5idWZmZXJUb3AuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGVsLnN0eWxlLmhlaWdodCA9IHRvcCArICdweCc7XG5cdH0pO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyQm90dG9tLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5oZWlnaHQgPSBib3R0b20gKyAncHgnO1xuXHR9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXRUYWJsZTogaW5pdFRhYmxlLFxuXHRpbml0Q29udGFpbmVyczogaW5pdENvbnRhaW5lcnMsXG5cdGluaXRCdWZmZXJzOiBpbml0QnVmZmVyc1xufTtcbn0se31dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIENlbGwgPSByZXF1aXJlKCcuLi9tb2RlbHMvY2VsbCcpO1xuXG5mdW5jdGlvbiBnZXRDZWxsKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpIHtcblx0dmFyIGNlbGxPYmogPSBjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdFx0cmV0dXJuIGVsLnJvd051bWJlciA9PT0gcm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY29sdW1uTnVtYmVyO1xuXHRcdH0pLFxuXHRcdHJvd09iaiA9IGNvbmZpZy5oZWFkZXJzW2NvbmZpZy5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlcl07XG5cblx0aWYgKHR5cGVvZiBjZWxsT2JqID09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y2VsbE9iaiA9IG5ldyBDZWxsKHtcblx0XHRcdGtleTogcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5LFxuXHRcdFx0dmFsdWU6IGNvbmZpZy5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XVxuXHRcdH0pO1xuXG5cdFx0Y2VsbE9iai51cGRhdGVBdHRyaWJ1dGVzKHtcblx0XHRcdHJvd051bWJlcjogcm93TnVtYmVyLFxuXHRcdFx0Y29sdW1uTnVtYmVyOiBjb2x1bW5OdW1iZXJcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBjZWxsT2JqO1xufVxuXG5mdW5jdGlvbiBnZXRGaXhlZENlbGwoY29uZmlnLCByb3dOdW1iZXIsIGNvbHVtbk51bWJlcikge1xuXHR2YXIgY2VsbE9iaiA9IG51bGwsXG5cdFx0cm93T2JqID0gY29uZmlnLmZpeGVkSGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGNlbGxPYmogPSBuZXcgQ2VsbCh7XG5cdFx0a2V5OiByb3dPYmpbY29sdW1uTnVtYmVyXS5rZXksXG5cdFx0dmFsdWU6IGNvbmZpZy5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XVxuXHR9KTtcblxuXHRyZXR1cm4gY2VsbE9iajtcbn1cblxuZnVuY3Rpb24gc2V0Q2VsbFZhbHVlKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIsIHZhbHVlKSB7XG5cdHZhciByb3dPYmogPSBjb25maWcuaGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGNvbmZpZy5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0NlbGxDaGFuZ2VkKGNvbmZpZywgY2VsbE9iaikge1xuXHR2YXIgb3JpZ2luYWxPYmogPSBnZXRDZWxsKGNvbmZpZywgY2VsbE9iai5yb3dOdW1iZXIsIGNlbGxPYmouY29sdW1uTnVtYmVyKSxcblx0XHRlZGl0ZWRPYmogPSBjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdFx0cmV0dXJuIGVsLnJvd051bWJlciA9PT0gY2VsbE9iai5yb3dOdW1iZXIgJiYgZWwuY29sdW1uTnVtYmVyID09PSBjZWxsT2JqLmNvbHVtbk51bWJlcjtcblx0XHR9KSxcblx0XHRvcmlnaW5hbFZhbCA9IG9yaWdpbmFsT2JqLnZhbHVlIHx8ICcnO1xuXG5cdHJldHVybiBvcmlnaW5hbFZhbCAhPT0gY2VsbE9iai52YWx1ZSB8fCB0eXBlb2YgZWRpdGVkT2JqICE9ICd1bmRlZmluZWQnO1xufVxuXG5mdW5jdGlvbiBzZXRVcGRhdGVkQ2VsbFZhbHVlKGNvbmZpZywgY2VsbE9iaikge1xuXHR2YXIgcHJldiA9IGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscy5maW5kKGZ1bmN0aW9uKGVsKSB7XG5cdFx0cmV0dXJuIGVsLnJvd051bWJlciA9PT0gY2VsbE9iai5yb3dOdW1iZXIgJiYgZWwuY29sdW1uTnVtYmVyID09PSBjZWxsT2JqLmNvbHVtbk51bWJlcjtcblx0fSk7XG5cblx0aWYgKHR5cGVvZiBwcmV2ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y29uZmlnLmlubmVyLmVkaXRlZENlbGxzLnB1c2goY2VsbE9iaik7XG5cdH0gZWxzZSB7XG5cdFx0cHJldi52YWx1ZSA9IGNlbGxPYmoudmFsdWU7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldENlbGw6IGdldENlbGwsXG5cdGdldEZpeGVkQ2VsbDogZ2V0Rml4ZWRDZWxsLFxuXHRzZXRDZWxsVmFsdWU6IHNldENlbGxWYWx1ZSxcblx0aXNDZWxsQ2hhbmdlZDogaXNDZWxsQ2hhbmdlZCxcblx0c2V0VXBkYXRlZENlbGxWYWx1ZTogc2V0VXBkYXRlZENlbGxWYWx1ZVxufTtcbn0se1wiLi4vbW9kZWxzL2NlbGxcIjoyfV19LHt9LFsxXSk7XG4iXSwiZmlsZSI6InZpcnR1YWwtZGF0YS1ncmlkLmpzIn0=
