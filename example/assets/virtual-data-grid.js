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
	filter: {
		enabled: false
	},
	sort: {
		enabled: true
	},
	eventHandlers: {
		onBeforeEdit: configUtil.nil,
		onValidation: configUtil.nil,
		onAfterEdit: configUtil.nil,
		onBeforeSave: configUtil.nil,
		onAfterSave: configUtil.nil
	},
	dataSource: [ ],
	headers: [ [ ] ],
	fixedHeaders: [ [ ] ],
	debug: false,
	inner: {}
};

var STATIC_INNER_ATTRS = {
	selectors: {
		bufferRowTop: 'buffer-row-top',
		bufferRowBottom: 'buffer-row-bottom',
		bufferColumnLeft: 'buffer-column-left',
		bufferColumnRight: 'buffer-column-right',
		headerRow: 'header-row',
		headerCell: 'header-cell',
		dataRow: 'data-row',
		dataCell: 'data-cell'
	},
	minBufferWidth: 2,
	minBufferHeight: 2, // Azért van rá szükség, mert ha nincs megadva, akkor ugrik egyett a scroll ha a végére vagy az elejére értünk a táblázatban
	leftCellOffset: 0,
	topCellOffset: 0,
	editedCells: []
};

function init(config, options) {
	initConfigObject(config);

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
	updateValue(config, options, 'filter.enabled');
	updateValue(config, options, 'sort.enabled');
	updateValue(config, options, 'debug');
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
	config.inner = Object.assign({}, STATIC_INNER_ATTRS);
}

function calculateVirtualContainerHeight(config, options) {
	var containerHeight = getInnerValue(options, 'dimensions.containerHeight');

	if (typeof containerHeight == 'undefined') {
		containerHeight = configUtil.getDefaultContainerHeight(config);
	}

	config.dimensions.containerHeight = configUtil.calculateVirtualContainerHeight(config, containerHeight);
}

function initInnerCalculatedValues(config) {
	// Annak a header sornak az indexe, ami a cella kulcsokat is meghatározza. Mivel ez mindig az utolsó lesz, ezért TODO: Kiszedni/átalakítani
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
	init: init
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

	return config.inner.minBufferHeight * 2 + Math.floor(height / config.dimensions.cellHeight) * config.dimensions.cellHeight;
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
	var hasFilter = config.filter.enabled,
		containerHeight = config.dimensions.containerHeight - config.inner.minBufferHeight * 2,
		dataCells = Math.floor(containerHeight / config.dimensions.cellHeight),
		headerCells = config.headers.length + (hasFilter ? 1 : 0);

	return dataCells - headerCells;
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
				cell.innerHTML = getHeaderCellHtml(config, cellObj);
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

function getHeaderCellHtml(config, cellObj) {
	var innerHTML = cellObj.text || cellObj.key || '';

	return innerHTML;
}

module.exports = {
	updateCell: updateCell,
	updateTable: updateTable,
	resetEditingCell: resetEditingCell,
	resetEditedCell: resetEditedCell,
	destroyTable: destroyTable,

	indexOfElement: indexOfElement,
	getHeaderCellHtml: getHeaderCellHtml
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

var domUtil = require('./dom');

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

	fixedContainer.style.padding = config.inner.minBufferHeight + 'px 0';
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
			tdElement.innerHTML = domUtil.getHeaderCellHtml(config, headerRow[j]);

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

	if (config.fixedHeaders.length === 0 || config.fixedHeaders[0].length === 0) {
		document.querySelector('.' + config.selectors.fixedTable).remove();

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
	left = left < config.inner.minBufferWidth ? config.inner.minBufferWidth : left;
	right = config.tableWidth - left;
	top = top + config.inner.minBufferHeight > config.tableHeight ? config.tableHeight + config.inner.minBufferHeight : top + config.inner.minBufferHeight;
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
},{"./dom":10}],14:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJy4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzJyk7cmVxdWlyZSgnLi9wb2xseWZpbGxzL05vZGVMaXN0LmZvckVhY2guanMnKTtcblxudmFyIFZpcnR1YWxEYXRhR3JpZCA9IHJlcXVpcmUoJy4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkJyk7XG5cbndpbmRvdy5WaXJ0dWFsRGF0YUdyaWQgPSBWaXJ0dWFsRGF0YUdyaWQ7XG59LHtcIi4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkXCI6NCxcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NyxcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6OH1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsT2JqZWN0KHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdrZXknKTtcblx0aW5pdEF0dHIoJ3ZhbHVlJyk7XG5cdGluaXRBdHRyKCdjbGFzcycpO1xuXHRpbml0QXR0cigncm93TnVtYmVyJyk7XG5cdGluaXRBdHRyKCdjb2x1bW5OdW1iZXInKTtcblxuXHRmdW5jdGlvbiBpbml0QXR0cihuYW1lKSB7XG5cdFx0c2VsZltuYW1lXSA9IHR5cGVvZiBwID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBwW25hbWVdID09ICd1bmRlZmluZWQnID8gbnVsbCA6IHBbbmFtZV07XG5cdH1cblxuXHR0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycykge1xuXHRcdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcblx0XHRcdGlmICh0eXBlb2YgYXR0cnNba10gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGZba10gIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0c2VsZltrXSA9IGF0dHJzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxPYmplY3Q7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRBcmd1bWVudHMocCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aW5pdEF0dHIoJ2NlbGwnKTtcblx0aW5pdEF0dHIoJ2NlbGxPYmplY3QnKTtcblx0aW5pdEF0dHIoJ2NhbmNlbEV2ZW50Jyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEFyZ3VtZW50cztcbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9nZW5lcmF0b3InKTtcblxudmFyIHVuaXF1ZUlkU2VxdWVuY2UgPSAxO1xuXG5mdW5jdGlvbiBWaXJ0dWFsRGF0YUdyaWQoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmNvbmZpZ3VyYXRpb24gPSB7fTtcblx0c2VsZi51bmlxdWVJZCA9IHVuaXF1ZUlkU2VxdWVuY2UrKztcblx0c2VsZi5nZW5lcmF0ZVRhYmxlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdGdlbmVyYXRvci5nZW5lcmF0ZVRhYmxlKHNlbGYuY29uZmlndXJhdGlvbiwgb3B0aW9ucyk7XG5cdH07XG5cdHNlbGYuZGVzdHJveVRhYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0Z2VuZXJhdG9yLmRlc3Ryb3lUYWJsZShzZWxmLmNvbmZpZ3VyYXRpb24pO1xuXHR9O1xuXHRzZWxmLmdldElkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlbGYudW5pcXVlSWQ7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbERhdGFHcmlkO1xufSx7XCIuLi9tb2R1bGVzL2dlbmVyYXRvclwiOjZ9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ1V0aWwgPSByZXF1aXJlKCcuLi91dGlscy9jb25maWd1cmF0aW9uJyksXG5cdGdlbmVyYXRvclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKTtcblxudmFyIERFRkFVTFRTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRtYWluQ29udGFpbmVyOiAnLmRhdGEtY29udGFpbmVyJyxcblx0XHRmaXhlZENvbnRhaW5lcjogJ2ZpeGVkLWNvbnRhaW5lcicsXG5cdFx0Zml4ZWRUYWJsZTogJ2ZpeGVkLXRhYmxlJyxcblx0XHR2aXJ0dWFsQ29udGFpbmVyOiAndmlydHVhbC1jb250YWluZXInLFxuXHRcdHZpcnR1YWxUYWJsZTogJ3ZpcnR1YWwtdGFibGUnLFxuXHRcdGVkaXRpbmdDZWxsOiAnZWRpdGluZy1jZWxsJyxcblx0XHRlZGl0ZWRDZWxsOiAnZWRpdGVkLWNlbGwnLFxuXHRcdHNhdmVCdXR0b246IG51bGxcblx0fSxcblx0ZGltZW5zaW9uczoge1xuXHRcdGNlbGxXaWR0aDogMTUwLFxuXHRcdGNlbGxIZWlnaHQ6IDUwLFxuXHRcdGNvbnRhaW5lckhlaWdodDogY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHR9LFxuXHRlZGl0OiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0ZmlsdGVyOiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0c29ydDoge1xuXHRcdGVuYWJsZWQ6IHRydWVcblx0fSxcblx0ZXZlbnRIYW5kbGVyczoge1xuXHRcdG9uQmVmb3JlRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25WYWxpZGF0aW9uOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25CZWZvcmVTYXZlOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyU2F2ZTogY29uZmlnVXRpbC5uaWxcblx0fSxcblx0ZGF0YVNvdXJjZTogWyBdLFxuXHRoZWFkZXJzOiBbIFsgXSBdLFxuXHRmaXhlZEhlYWRlcnM6IFsgWyBdIF0sXG5cdGRlYnVnOiBmYWxzZSxcblx0aW5uZXI6IHt9XG59O1xuXG52YXIgU1RBVElDX0lOTkVSX0FUVFJTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRidWZmZXJSb3dUb3A6ICdidWZmZXItcm93LXRvcCcsXG5cdFx0YnVmZmVyUm93Qm90dG9tOiAnYnVmZmVyLXJvdy1ib3R0b20nLFxuXHRcdGJ1ZmZlckNvbHVtbkxlZnQ6ICdidWZmZXItY29sdW1uLWxlZnQnLFxuXHRcdGJ1ZmZlckNvbHVtblJpZ2h0OiAnYnVmZmVyLWNvbHVtbi1yaWdodCcsXG5cdFx0aGVhZGVyUm93OiAnaGVhZGVyLXJvdycsXG5cdFx0aGVhZGVyQ2VsbDogJ2hlYWRlci1jZWxsJyxcblx0XHRkYXRhUm93OiAnZGF0YS1yb3cnLFxuXHRcdGRhdGFDZWxsOiAnZGF0YS1jZWxsJ1xuXHR9LFxuXHRtaW5CdWZmZXJXaWR0aDogMixcblx0bWluQnVmZmVySGVpZ2h0OiAyLCAvLyBBesOpcnQgdmFuIHLDoSBzesO8a3PDqWcsIG1lcnQgaGEgbmluY3MgbWVnYWR2YSwgYWtrb3IgdWdyaWsgZWd5ZXR0IGEgc2Nyb2xsIGhhIGEgdsOpZ8OpcmUgdmFneSBheiBlbGVqw6lyZSDDqXJ0w7xuayBhIHTDoWJsw6F6YXRiYW5cblx0bGVmdENlbGxPZmZzZXQ6IDAsXG5cdHRvcENlbGxPZmZzZXQ6IDAsXG5cdGVkaXRlZENlbGxzOiBbXVxufTtcblxuZnVuY3Rpb24gaW5pdChjb25maWcsIG9wdGlvbnMpIHtcblx0aW5pdENvbmZpZ09iamVjdChjb25maWcpO1xuXG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5tYWluQ29udGFpbmVyJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5maXhlZENvbnRhaW5lcicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMuZml4ZWRUYWJsZScpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMudmlydHVhbFRhYmxlJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5lZGl0aW5nQ2VsbCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMuZWRpdGVkQ2VsbCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdzZWxlY3RvcnMuc2F2ZUJ1dHRvbicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdkaW1lbnNpb25zLmNlbGxXaWR0aCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdkaW1lbnNpb25zLmNlbGxIZWlnaHQnKTtcblxuXHRjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGNvbmZpZywgb3B0aW9ucyk7XG5cblx0Z2VuZXJhdG9yVXRpbC5pbml0Q29udGFpbmVycyhjb25maWcpO1xuXG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2RhdGFTb3VyY2UnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnaGVhZGVycycpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdmaXhlZEhlYWRlcnMnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZWRpdC5lbmFibGVkJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2ZpbHRlci5lbmFibGVkJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NvcnQuZW5hYmxlZCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdkZWJ1ZycpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uQmVmb3JlRWRpdCcpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uVmFsaWRhdGlvbicpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdldmVudEhhbmRsZXJzLm9uQWZ0ZXJFZGl0Jyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25CZWZvcmVTYXZlJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25BZnRlclNhdmUnKTtcblxuXHRpbml0SW5uZXJDYWxjdWxhdGVkVmFsdWVzKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGluaXRDb25maWdPYmplY3QoY29uZmlnKSB7XG5cdGNvbmZpZy5zZWxlY3RvcnMgPSB7fTtcblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMgPSB7fTtcblx0Y29uZmlnLmlubmVyID0gT2JqZWN0LmFzc2lnbih7fSwgU1RBVElDX0lOTkVSX0FUVFJTKTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIG9wdGlvbnMpIHtcblx0dmFyIGNvbnRhaW5lckhlaWdodCA9IGdldElubmVyVmFsdWUob3B0aW9ucywgJ2RpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0Jyk7XG5cblx0aWYgKHR5cGVvZiBjb250YWluZXJIZWlnaHQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRjb250YWluZXJIZWlnaHQgPSBjb25maWdVdGlsLmdldERlZmF1bHRDb250YWluZXJIZWlnaHQoY29uZmlnKTtcblx0fVxuXG5cdGNvbmZpZy5kaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCA9IGNvbmZpZ1V0aWwuY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIGNvbnRhaW5lckhlaWdodCk7XG59XG5cbmZ1bmN0aW9uIGluaXRJbm5lckNhbGN1bGF0ZWRWYWx1ZXMoY29uZmlnKSB7XG5cdC8vIEFubmFrIGEgaGVhZGVyIHNvcm5hayBheiBpbmRleGUsIGFtaSBhIGNlbGxhIGt1bGNzb2thdCBpcyBtZWdoYXTDoXJvenphLiBNaXZlbCBleiBtaW5kaWcgYXogdXRvbHPDsyBsZXN6LCBlesOpcnQgVE9ETzogS2lzemVkbmkvw6F0YWxha8OtdGFuaVxuXHRjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXIgPSBjb25maWdVdGlsLmdldEluZGV4T2ZDZWxsS2V5SGVhZGVyKGNvbmZpZyk7XG5cdGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0ID0gY29uZmlnVXRpbC5nZXRNYXhDb2xzcGFuKGNvbmZpZyk7XG5cdGNvbmZpZy5pbm5lci52aXNpYmxlUm93TnVtYmVyID0gY29uZmlnVXRpbC5nZXRWaXNpYmxlUm93TnVtYmVyKGNvbmZpZyk7XG5cdGNvbmZpZy5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyID0gY29uZmlnVXRpbC5nZXRWaXNpYmxlQ29sdW1uTnVtYmVyKGNvbmZpZyk7XG5cdGNvbmZpZy50YWJsZVdpZHRoID0gY29uZmlnVXRpbC5nZXRUYWJsZVdpZHRoKGNvbmZpZyk7XG5cdGNvbmZpZy50YWJsZUhlaWdodCA9IGNvbmZpZ1V0aWwuZ2V0VGFibGVIZWlnaHQoY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCBrZXkpIHtcblx0dmFyIHRhcmdldCA9IGdldElubmVyT2JqZWN0KGNvbmZpZywga2V5KSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuXHRcdHZhbHVlID0gZ2V0SW5uZXJWYWx1ZShvcHRpb25zLCBrZXkpLFxuXHRcdGtleXMgPSBrZXkuc3BsaXQoJy4nKSxcblx0XHRsYXN0S2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuXG5cdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHR0YXJnZXRbbGFzdEtleV0gPSB0eXBlb2YgZ2V0SW5uZXJWYWx1ZShERUZBVUxUUywga2V5KSA9PSAnZnVuY3Rpb24nID8gZ2V0SW5uZXJWYWx1ZShERUZBVUxUUywga2V5KShjb25maWcpIDogZ2V0SW5uZXJWYWx1ZShERUZBVUxUUywga2V5KTtcblx0fSBlbHNlIHtcblx0XHR0YXJnZXRbbGFzdEtleV0gPSB2YWx1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRJbm5lck9iamVjdChvYmplY3QsIGtleSkge1xuXHRpZiAoa2V5LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cblx0dmFyIHN1YktleSA9IGtleS5zcGxpdCgnLicpWzBdLFxuXHRcdHN1Yk9iamVjdCA9IG9iamVjdFtzdWJLZXldO1xuXG5cdGlmICh0eXBlb2Ygc3ViT2JqZWN0ID09ICd1bmRlZmluZWQnKSB7XG5cdFx0b2JqZWN0W3N1YktleV0gPSB7fTtcblx0XHRzdWJPYmplY3QgPSBvYmplY3Rbc3ViS2V5XTtcblx0fVxuXG5cdHJldHVybiBnZXRJbm5lck9iamVjdChzdWJPYmplY3QsIGtleS5zdWJzdHJpbmcoa2V5LmluZGV4T2YoJy4nKSArIDEpKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5uZXJWYWx1ZShvYmplY3QsIGtleSkge1xuXHRpZiAoa2V5LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcblx0XHRyZXR1cm4gb2JqZWN0W2tleV07XG5cdH1cblxuXHR2YXIgc3ViS2V5ID0ga2V5LnNwbGl0KCcuJylbMF0sXG5cdFx0c3ViT2JqZWN0ID0gb2JqZWN0W3N1YktleV07XG5cblx0aWYgKHR5cGVvZiBzdWJPYmplY3QgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZXR1cm4gc3ViT2JqZWN0O1xuXHR9XG5cblx0cmV0dXJuIGdldElubmVyVmFsdWUoc3ViT2JqZWN0LCBrZXkuc3Vic3RyaW5nKGtleS5pbmRleE9mKCcuJykgKyAxKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBpbml0XG59O1xufSx7XCIuLi91dGlscy9jb25maWd1cmF0aW9uXCI6OSxcIi4uL3V0aWxzL2dlbmVyYXRvclwiOjEzfV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25maWd1cmF0aW9uICAgID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uJyksXG5cdGV2ZW50SGFuZGxlclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9ldmVudC1oYW5kbGVyJyksXG5cdGdlbmVyYXRvclV0aWwgICAgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKSxcblx0ZG9tVXRpbCAgICAgICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzL2RvbScpO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVRhYmxlKGNvbmZpZywgb3B0aW9ucykge1xuXHRjb25maWd1cmF0aW9uLmluaXQoY29uZmlnLCBvcHRpb25zKTtcblxuXHRnZW5lcmF0b3JVdGlsLmluaXRUYWJsZShjb25maWcpO1xuXHRnZW5lcmF0b3JVdGlsLmluaXRCdWZmZXJzKGNvbmZpZyk7XG5cblx0ZG9tVXRpbC51cGRhdGVUYWJsZShjb25maWcpO1xuXG5cdGV2ZW50SGFuZGxlclV0aWwuYWRkRXZlbnRzKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZShjb25maWcpIHtcblx0ZXZlbnRIYW5kbGVyVXRpbC5yZW1vdmVFdmVudHMoY29uZmlnKTtcblx0ZG9tVXRpbC5kZXN0cm95VGFibGUoY29uZmlnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdlbmVyYXRlVGFibGU6IGdlbmVyYXRlVGFibGUsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlXG59O1xufSx7XCIuLi91dGlscy9kb21cIjoxMCxcIi4uL3V0aWxzL2V2ZW50LWhhbmRsZXJcIjoxMixcIi4uL3V0aWxzL2dlbmVyYXRvclwiOjEzLFwiLi9jb25maWd1cmF0aW9uXCI6NX1dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5pZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZS5maW5kID09ICd1bmRlZmluZWQnKSB7XG5cdEFycmF5LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24ocHJlZGljYXRlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXh0ZW5kLW5hdGl2ZVxuXHRcdGlmICh0aGlzID09PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdBcnJheS5wcm90b3R5cGUuZmluZCBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHByZWRpY2F0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHRcdH1cblxuXHRcdHZhciBsaXN0ID0gT2JqZWN0KHRoaXMpO1xuXHRcdHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA+Pj4gMDtcblx0XHR2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXTtcblx0XHR2YXIgdmFsdWU7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YWx1ZSA9IGxpc3RbaV07XG5cdFx0XHRpZiAocHJlZGljYXRlLmNhbGwodGhpc0FyZywgdmFsdWUsIGksIGxpc3QpKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdW5kZWZpbmVkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmaW5lZFxuXHR9O1xufVxufSx7fV0sODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmlmICghTm9kZUxpc3QucHJvdG90eXBlLmZvckVhY2gpIHtcblx0Tm9kZUxpc3QucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgYXJndW1lbnQpIHtcblx0XHRhcmd1bWVudCA9IGFyZ3VtZW50IHx8IHdpbmRvdztcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChhcmd1bWVudCwgdGhpc1tpXSwgaSwgdGhpcyk7XG5cdFx0fVxuXHR9O1xufVxufSx7fV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoY29uZmlnLCBoZWlnaHQpIHtcblx0aWYgKHR5cGVvZiBoZWlnaHQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZXR1cm4gaGVpZ2h0O1xuXHR9XG5cblx0cmV0dXJuIGNvbmZpZy5pbm5lci5taW5CdWZmZXJIZWlnaHQgKiAyICsgTWF0aC5mbG9vcihoZWlnaHQgLyBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KSAqIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQ7XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRDb250YWluZXJIZWlnaHQoY29uZmlnKSB7XG5cdHJldHVybiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGNvbmZpZywgd2luZG93LmlubmVySGVpZ2h0IC0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLm1haW5Db250YWluZXIpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIDY0KTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIoY29uZmlnKSB7XG5cdHJldHVybiBjb25maWcuaGVhZGVycy5sZW5ndGggLSAxO1xufVxuXG5mdW5jdGlvbiBnZXRNYXhDb2xzcGFuKGNvbmZpZykge1xuXHR2YXIgbWF4VmFsID0gMDtcblxuXHRjb25maWcuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0XHRlbGVtZW50LmZvckVhY2goZnVuY3Rpb24oc3ViRWxlbWVudCkge1xuXHRcdFx0aWYgKHR5cGVvZiBzdWJFbGVtZW50LmNvbHNwYW4gIT0gJ3VuZGVmaW5lZCcgJiYgbWF4VmFsIDwgc3ViRWxlbWVudC5jb2xzcGFuKSB7XG5cdFx0XHRcdG1heFZhbCA9IHN1YkVsZW1lbnQuY29sc3Bhbjtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIG1heFZhbDtcbn1cblxuZnVuY3Rpb24gZ2V0VmlzaWJsZVJvd051bWJlcihjb25maWcpIHtcblx0dmFyIGhhc0ZpbHRlciA9IGNvbmZpZy5maWx0ZXIuZW5hYmxlZCxcblx0XHRjb250YWluZXJIZWlnaHQgPSBjb25maWcuZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQgLSBjb25maWcuaW5uZXIubWluQnVmZmVySGVpZ2h0ICogMixcblx0XHRkYXRhQ2VsbHMgPSBNYXRoLmZsb29yKGNvbnRhaW5lckhlaWdodCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQpLFxuXHRcdGhlYWRlckNlbGxzID0gY29uZmlnLmhlYWRlcnMubGVuZ3RoICsgKGhhc0ZpbHRlciA/IDEgOiAwKTtcblxuXHRyZXR1cm4gZGF0YUNlbGxzIC0gaGVhZGVyQ2VsbHM7XG59XG5cbmZ1bmN0aW9uIGdldFZpc2libGVDb2x1bW5OdW1iZXIoY29uZmlnKSB7XG5cdHJldHVybiBNYXRoLmZsb29yKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5vZmZzZXRXaWR0aCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCArXG5cdFx0KGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0ID4gMiA/IGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0IDogMikgKyBjb25maWcuaW5uZXIuY29sc3Bhbk9mZnNldCk7XG59XG5cbmZ1bmN0aW9uIGdldFRhYmxlV2lkdGgoY29uZmlnKSB7XG5cdHJldHVybiAoY29uZmlnLmhlYWRlcnNbY29uZmlnLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXS5sZW5ndGggLSBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcikgKiBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGg7XG59XG5cbmZ1bmN0aW9uIGdldFRhYmxlSGVpZ2h0KGNvbmZpZykge1xuXHRyZXR1cm4gKGNvbmZpZy5kYXRhU291cmNlLmxlbmd0aCAtIGNvbmZpZy5pbm5lci52aXNpYmxlUm93TnVtYmVyICsgMSkgKiBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0O1xufVxuXG5mdW5jdGlvbiBuaWwoKSB7XG5cdHJldHVybiBmdW5jdGlvbigpIHt9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Y2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodDogY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodCxcblx0Z2V0RGVmYXVsdENvbnRhaW5lckhlaWdodDogZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodCxcblx0Z2V0SW5kZXhPZkNlbGxLZXlIZWFkZXI6IGdldEluZGV4T2ZDZWxsS2V5SGVhZGVyLFxuXHRnZXRNYXhDb2xzcGFuOiBnZXRNYXhDb2xzcGFuLFxuXHRnZXRWaXNpYmxlUm93TnVtYmVyOiBnZXRWaXNpYmxlUm93TnVtYmVyLFxuXHRnZXRWaXNpYmxlQ29sdW1uTnVtYmVyOiBnZXRWaXNpYmxlQ29sdW1uTnVtYmVyLFxuXHRnZXRUYWJsZVdpZHRoOiBnZXRUYWJsZVdpZHRoLFxuXHRnZXRUYWJsZUhlaWdodDogZ2V0VGFibGVIZWlnaHQsXG5cdG5pbDogbmlsXG59O1xufSx7fV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpO1xuXG5mdW5jdGlvbiBpbmRleE9mRWxlbWVudChlbGVtZW50KSB7XG5cdHZhciBjb2xsZWN0aW9uID0gZWxlbWVudC5wYXJlbnROb2RlLmNoaWxkTm9kZXM7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKGNvbGxlY3Rpb25baV0gPT09IGVsZW1lbnQpIHtcblx0XHRcdHJldHVybiBpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2VsbChjb25maWcsIGNlbGwsIGNlbGxPYmopIHtcblx0Y2VsbC5pbm5lckhUTUwgPSBjZWxsT2JqLnZhbHVlO1xuXHRjZWxsLmNsYXNzTmFtZSA9IGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwgKyAnICcgKyAoY2VsbE9iai5jbGFzcyB8fCAnJyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVRhYmxlKGNvbmZpZykge1xuXHR2YXIgY291bnRSb3cgPSAwLFxuXHRcdGNvbHNwYW4gPSAxO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRyLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlclJvdykuZm9yRWFjaChmdW5jdGlvbihyb3cpIHtcblx0XHRyb3cucXVlcnlTZWxlY3RvckFsbCgndGQuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuaGVhZGVyQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR2YXIgY2VsbE9iaiA9IGNvbmZpZy5oZWFkZXJzW2NvdW50Um93XVtjb25maWcuaW5uZXIubGVmdENlbGxPZmZzZXQgKyBjZWxsTnVtYmVyXTtcblxuXHRcdFx0aWYgKGNvbHNwYW4gPiAxKSB7XG5cdFx0XHRcdGNlbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0Y29sc3Bhbi0tO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2VsbC5pbm5lckhUTUwgPSBnZXRIZWFkZXJDZWxsSHRtbChjb25maWcsIGNlbGxPYmopO1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAndGFibGUtY2VsbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgY2VsbE9iai5jb2xzcGFuID09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNlbGwucmVtb3ZlQXR0cmlidXRlKCdjb2xzcGFuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2FsY3VsYXRlZENvbHNwYW4gPSBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlciA8PSBjZWxsTnVtYmVyICsgY2VsbE9iai5jb2xzcGFuID8gY29uZmlnLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIgLSBjZWxsTnVtYmVyIDogY2VsbE9iai5jb2xzcGFuO1xuXG5cdFx0XHRcdGNlbGwuc2V0QXR0cmlidXRlKCdjb2xzcGFuJywgY2FsY3VsYXRlZENvbHNwYW4pO1xuXHRcdFx0XHRjb2xzcGFuID0gY2FsY3VsYXRlZENvbHNwYW47XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Y291bnRSb3crKztcblx0XHRjb2xzcGFuID0gMTtcblx0fSk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdykuZm9yRWFjaChmdW5jdGlvbihyb3csIHJvd051bWJlcikge1xuXHRcdHJvdy5xdWVyeVNlbGVjdG9yQWxsKCd0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR1cGRhdGVDZWxsKGNvbmZpZywgY2VsbCwgdGFibGVVdGlsLmdldENlbGwoY29uZmlnLCBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCArIHJvd051bWJlciwgY29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcikpO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSArICcgdHIuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YVJvdykuZm9yRWFjaChmdW5jdGlvbihyb3csIHJvd051bWJlcikge1xuXHRcdHJvdy5xdWVyeVNlbGVjdG9yQWxsKCd0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR1cGRhdGVDZWxsKGNvbmZpZywgY2VsbCwgdGFibGVVdGlsLmdldEZpeGVkQ2VsbChjb25maWcsIGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjZWxsTnVtYmVyKSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgb25JbnB1dEJsdXJFdmVudEhhbmRsZXIpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdGQuJyArIGNvbmZpZy5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpLmZvckVhY2goZnVuY3Rpb24oZWRpdGluZ0NlbGwpIHtcblx0XHR2YXIgaW5wdXQgPSBlZGl0aW5nQ2VsbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuXG5cdFx0aW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0XHRlZGl0aW5nQ2VsbC5pbm5lckhUTUwgPSBpbnB1dC52YWx1ZTtcblx0XHRlZGl0aW5nQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRFZGl0ZWRDZWxsKGNvbmZpZykge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlZGl0ZWRDZWxsKSB7XG5cdFx0ZWRpdGVkQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdH0pO1xuXG5cdGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscyA9IFtdO1xuXHR1cGRhdGVUYWJsZShjb25maWcpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95VGFibGUoY29uZmlnKSB7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnLnNlbGVjdG9ycy5tYWluQ29udGFpbmVyKS5pbm5lckhUTUwgPSAnJztcbn1cblxuZnVuY3Rpb24gZ2V0SGVhZGVyQ2VsbEh0bWwoY29uZmlnLCBjZWxsT2JqKSB7XG5cdHZhciBpbm5lckhUTUwgPSBjZWxsT2JqLnRleHQgfHwgY2VsbE9iai5rZXkgfHwgJyc7XG5cblx0cmV0dXJuIGlubmVySFRNTDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHVwZGF0ZUNlbGw6IHVwZGF0ZUNlbGwsXG5cdHVwZGF0ZVRhYmxlOiB1cGRhdGVUYWJsZSxcblx0cmVzZXRFZGl0aW5nQ2VsbDogcmVzZXRFZGl0aW5nQ2VsbCxcblx0cmVzZXRFZGl0ZWRDZWxsOiByZXNldEVkaXRlZENlbGwsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlLFxuXG5cdGluZGV4T2ZFbGVtZW50OiBpbmRleE9mRWxlbWVudCxcblx0Z2V0SGVhZGVyQ2VsbEh0bWw6IGdldEhlYWRlckNlbGxIdG1sXG59O1xufSx7XCIuL3RhYmxlXCI6MTR9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEFyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL21vZGVscy9ldmVudC1hcmd1bWVudHMnKSxcblx0dGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpLFxuXHRkb21VdGlsICAgPSByZXF1aXJlKCcuL2RvbScpO1xuXG5mdW5jdGlvbiBzYXZlQ2VsbHMoY29uZmlnKSB7XG5cdGlmICghY29uZmlnLmVkaXQuZW5hYmxlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsT2JqZWN0OiBjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMsXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZy5ldmVudEhhbmRsZXJzLm9uQmVmb3JlU2F2ZShhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHRjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKSB7XG5cdFx0XHR0YWJsZVV0aWwuc2V0Q2VsbFZhbHVlKGNvbmZpZywgY2VsbC5yb3dOdW1iZXIsIGNlbGwuY29sdW1uTnVtYmVyLCBjZWxsLnZhbHVlKTtcblx0XHR9KTtcblx0XHRkb21VdGlsLnJlc2V0RWRpdGVkQ2VsbChjb25maWcpO1xuXG5cdFx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25BZnRlclNhdmUoYXJncyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHNhdmVDZWxsczogc2F2ZUNlbGxzXG59O1xufSx7XCIuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzXCI6MyxcIi4vZG9tXCI6MTAsXCIuL3RhYmxlXCI6MTR9XSwxMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEFyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL21vZGVscy9ldmVudC1hcmd1bWVudHMnKTtcblxudmFyIGRvbVV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9kb20nKSxcblx0dGFibGVVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvdGFibGUnKSxcblx0ZWRpdFV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9lZGl0JyksXG5cdGdlbmVyYXRvclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKTtcblxudmFyIGNvbnRhaW5lcjtcblxudmFyIGluc3RhbmNlcyA9IHtcblx0b25TY3JvbGxFdmVudEhhbmRsZXI6IGZ1bmN0aW9uKCkge30sXG5cdG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyOiBmdW5jdGlvbigpIHt9LFxuXHRvbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcjogZnVuY3Rpb24oKSB7fSxcblx0b25DbGlja1NhdmVCdXR0b25FdmVudEhhbmRsZXI6IGZ1bmN0aW9uKCkge31cbn07XG5cbmZ1bmN0aW9uIG9uV2hlZWxFdmVudEhhbmRsZXIoZXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRjb250YWluZXIuc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWTtcblx0Y29udGFpbmVyLnNjcm9sbExlZnQgKz0gZXZlbnQuZGVsdGFYO1xufVxuXG5mdW5jdGlvbiBvblNjcm9sbEV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKSB7XG5cdGRvbVV0aWwucmVzZXRFZGl0aW5nQ2VsbChjb25maWcsIGluc3RhbmNlcy5vbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdGdlbmVyYXRvclV0aWwuaW5pdEJ1ZmZlcnMoY29uZmlnKTtcblx0ZG9tVXRpbC51cGRhdGVUYWJsZShjb25maWcpO1xufVxuXG5mdW5jdGlvbiBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKSB7XG5cdHZhciBjZWxsID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUsXG5cdFx0cm93TnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChjZWxsLnBhcmVudE5vZGUpICsgY29uZmlnLmlubmVyLnRvcENlbGxPZmZzZXQsXG5cdFx0Y29sdW1uTnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChjZWxsKSAtIDEgKyBjb25maWcuaW5uZXIubGVmdENlbGxPZmZzZXQsXG5cdFx0ZWRpdGVkT2JqID0gdGFibGVVdGlsLmdldENlbGwoY29uZmlnLCByb3dOdW1iZXIsIGNvbHVtbk51bWJlcik7XG5cblx0ZWRpdGVkT2JqLnVwZGF0ZUF0dHJpYnV0ZXMoe1xuXHRcdHZhbHVlOiBldmVudC50YXJnZXQudmFsdWUsXG5cdFx0Y2xhc3M6IGNvbmZpZy5zZWxlY3RvcnMuZWRpdGVkQ2VsbFxuXHR9KTtcblxuXHRpZiAoIXRhYmxlVXRpbC5pc0NlbGxDaGFuZ2VkKGNvbmZpZywgZWRpdGVkT2JqKSkge1xuXHRcdGRvbVV0aWwucmVzZXRFZGl0aW5nQ2VsbChjb25maWcsIGluc3RhbmNlcy5vbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbDogY2VsbCxcblx0XHRjZWxsT2JqZWN0OiBlZGl0ZWRPYmosXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZy5ldmVudEhhbmRsZXJzLm9uVmFsaWRhdGlvbihhcmdzKTtcblxuXHRpZiAoYXJncy5jYW5jZWxFZGl0ICE9PSB0cnVlKSB7XG5cdFx0dGFibGVVdGlsLnNldFVwZGF0ZWRDZWxsVmFsdWUoY29uZmlnLCBhcmdzLmNlbGxPYmplY3QpO1xuXHRcdGRvbVV0aWwudXBkYXRlQ2VsbChjb25maWcsIGFyZ3MuY2VsbCwgYXJncy5jZWxsT2JqZWN0KTtcblxuXHRcdGNvbmZpZy5ldmVudEhhbmRsZXJzLm9uQWZ0ZXJFZGl0KGFyZ3MpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpIHtcblx0aWYgKCFjb25maWcuZWRpdC5lbmFibGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIHJvd051bWJlciA9IGRvbVV0aWwuaW5kZXhPZkVsZW1lbnQoZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUpICsgY29uZmlnLmlubmVyLnRvcENlbGxPZmZzZXQsXG5cdFx0Y29sdW1uTnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChldmVudC50YXJnZXQpIC0gMSArIGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCxcblx0XHRlZGl0ZWRPYmogPSB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyKSxcblx0XHRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0aW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbDogZXZlbnQudGFyZ2V0LFxuXHRcdGNlbGxPYmplY3Q6IGVkaXRlZE9iaixcblx0XHRjYW5jZWxFdmVudDogZmFsc2Vcblx0fSk7XG5cblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25CZWZvcmVFZGl0KGFyZ3MpO1xuXG5cdGlmICghYXJncy5jYW5jZWxFdmVudCkge1xuXHRcdGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGluZ0NlbGwpO1xuXHRcdGV2ZW50LnRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZy5zZWxlY3RvcnMuZWRpdGVkQ2VsbCk7XG5cdFx0ZXZlbnQudGFyZ2V0LmlubmVySFRNTCA9ICcnO1xuXHRcdGV2ZW50LnRhcmdldC5hcHBlbmRDaGlsZChpbnB1dCk7XG5cblx0XHRpbnN0YW5jZXMub25JbnB1dEJsdXJFdmVudEhhbmRsZXIgPSBmdW5jdGlvbihldikgeyBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcihldiwgY29uZmlnKTsgfTtcblxuXHRcdGlucHV0LmZvY3VzKCk7XG5cdFx0aW5wdXQudmFsdWUgPSBlZGl0ZWRPYmoudmFsdWU7XG5cdFx0aW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGluc3RhbmNlcy5vbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DbGlja1NhdmVCdXR0b25FdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZykge1xuXHRlZGl0VXRpbC5zYXZlQ2VsbHMoY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRzKGNvbmZpZykge1xuXHRjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcik7XG5cblx0aW5zdGFuY2VzLm9uU2Nyb2xsRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHsgb25TY3JvbGxFdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZyk7IH07XG5cdGluc3RhbmNlcy5vbkNsaWNrQ2VsbEV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7IG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpOyB9O1xuXHRpbnN0YW5jZXMub25DbGlja1NhdmVCdXR0b25FdmVudEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkgeyBvbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKTsgfTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlciwgeyBwYXNzaXZlOiBmYWxzZSwgY2FwdHVyZTogdHJ1ZSB9KTtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaW5zdGFuY2VzLm9uU2Nyb2xsRXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGlmIChjb25maWcuZWRpdC5lbmFibGVkICYmIGNvbmZpZy5zZWxlY3RvcnMuc2F2ZUJ1dHRvbiAhPT0gbnVsbCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnLnNlbGVjdG9ycy5zYXZlQnV0dG9uKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGluc3RhbmNlcy5vbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRpZiAoY29uZmlnLmVkaXQuZW5hYmxlZCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGluc3RhbmNlcy5vbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcik7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRzKGNvbmZpZykge1xuXHRjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcik7XG5cblx0aWYgKGNvbnRhaW5lciAhPT0gbnVsbCkge1xuXHRcdGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIG9uV2hlZWxFdmVudEhhbmRsZXIpO1xuXHRcdGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBpbnN0YW5jZXMub25TY3JvbGxFdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZy5lZGl0LmVuYWJsZWQgJiYgY29uZmlnLnNlbGVjdG9ycy5zYXZlQnV0dG9uICE9PSBudWxsKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLnNhdmVCdXR0b24pLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5zdGFuY2VzLm9uQ2xpY2tTYXZlQnV0dG9uRXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGlmIChjb25maWcuZWRpdC5lbmFibGVkKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdGQuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuZGF0YUNlbGwpLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5zdGFuY2VzLm9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyKTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0YWRkRXZlbnRzOiBhZGRFdmVudHMsXG5cdHJlbW92ZUV2ZW50czogcmVtb3ZlRXZlbnRzXG59O1xufSx7XCIuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzXCI6MyxcIi4uL3V0aWxzL2RvbVwiOjEwLFwiLi4vdXRpbHMvZWRpdFwiOjExLFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTMsXCIuLi91dGlscy90YWJsZVwiOjE0fV0sMTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9tVXRpbCA9IHJlcXVpcmUoJy4vZG9tJyk7XG5cbmZ1bmN0aW9uIGluaXRDb250YWluZXJzKGNvbmZpZykge1xuXHR2YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLm1haW5Db250YWluZXIpLFxuXHRcdHZpcnR1YWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHR2aXJ0dWFsVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuXHRcdGZpeGVkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0Zml4ZWRUYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XG5cblx0dmlydHVhbENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcik7XG5cdHZpcnR1YWxUYWJsZS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKTtcblx0Zml4ZWRDb250YWluZXIuY2xhc3NMaXN0LmFkZChjb25maWcuc2VsZWN0b3JzLmZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRUYWJsZS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsQ29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxUYWJsZSk7XG5cblx0dmlydHVhbENvbnRhaW5lci5zdHlsZS5tYXhIZWlnaHQgPSBjb25maWcuZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQgKyAncHgnO1xuXHR2aXJ0dWFsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cblx0Zml4ZWRDb250YWluZXIuc3R5bGUucGFkZGluZyA9IGNvbmZpZy5pbm5lci5taW5CdWZmZXJIZWlnaHQgKyAncHggMCc7XG5cdGZpeGVkQ29udGFpbmVyLnN0eWxlLmZsb2F0ID0gJ2xlZnQnO1xufVxuXG5mdW5jdGlvbiBpbml0VGFibGUoY29uZmlnKSB7XG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgdGFibGVcblx0dmFyIHZpcnR1YWxUaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyksXG5cdFx0dmlydHVhbFRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGJvZHknKSxcblx0XHR0ckhlYWRCdWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXG5cdHRySGVhZEJ1ZmZlci5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93VG9wQ2xhc3MpO1xuXG5cdHZhciBpLCBqLCB0ckhlYWQsIHRyQm9keSwgYnVmZmVyQ29sdW1uTGVmdCwgYnVmZmVyQ29sdW1uUmlnaHQsIGJ1ZmZlclJvd0JvdHRvbSwgdGRFbGVtZW50O1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgaGVhZGVyXG5cdGJ1ZmZlckNvbHVtbkxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5MZWZ0LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0KTtcblxuXHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQoYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0Zm9yIChpID0gMDsgaSA8IGNvbmZpZy5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyOyBpKyspIHtcblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdH1cblxuXHRidWZmZXJDb2x1bW5SaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdGJ1ZmZlckNvbHVtblJpZ2h0LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5SaWdodCk7XG5cblx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKGJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHR2aXJ0dWFsVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkQnVmZmVyKTtcblxuXHRjb25maWcuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlclJvdykge1xuXHRcdHRySGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJIZWFkLmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJSb3cpO1xuXHRcdHRySGVhZC5zdHlsZS5oZWlnaHQgPSBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJDb2x1bW5MZWZ0KTtcblxuXHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGNvbmZpZy5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBkb21VdGlsLmdldEhlYWRlckNlbGxIdG1sKGNvbmZpZywgaGVhZGVyUm93W2pdKTtcblxuXHRcdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH0pO1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgYm9keVxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQodHJCb2R5KTtcblx0fVxuXG5cdGJ1ZmZlclJvd0JvdHRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdGJ1ZmZlclJvd0JvdHRvbS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tKTtcblxuXHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQoYnVmZmVyUm93Qm90dG9tKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGhlYWQpO1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGJvZHkpO1xuXG5cdGNvbmZpZy5pbm5lci5idWZmZXJMZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyUmlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlckJvdHRvbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dCb3R0b20pO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIHRhYmxlXG5cblx0aWYgKGNvbmZpZy5maXhlZEhlYWRlcnMubGVuZ3RoID09PSAwIHx8IGNvbmZpZy5maXhlZEhlYWRlcnNbMF0ubGVuZ3RoID09PSAwKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLmZpeGVkVGFibGUpLnJlbW92ZSgpO1xuXG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGZpeGVkVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdGZpeGVkVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGhlYWRlclxuXG5cdGZvciAoaSA9IDA7IGkgPCBjb25maWcuZml4ZWRIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHJIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckhlYWQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlclJvdyk7XG5cdFx0dHJIZWFkLnN0eWxlLmhlaWdodCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGNvbmZpZy5maXhlZEhlYWRlcnNbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBjb25maWcuZml4ZWRIZWFkZXJzW2ldW2pdLnRleHQgfHwgY29uZmlnLmZpeGVkSGVhZGVyc1tpXVtqXS5rZXkgfHwgJyc7XG5cblx0XHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGZpeGVkVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkKTtcblx0fVxuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGJvZHlcblxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgY29uZmlnLmZpeGVkSGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRib2R5LmFwcGVuZENoaWxkKHRyQm9keSk7XG5cdH1cblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSkuYXBwZW5kQ2hpbGQoZml4ZWRUaGVhZCk7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy5maXhlZFRhYmxlKS5hcHBlbmRDaGlsZChmaXhlZFRib2R5KTtcbn1cblxuZnVuY3Rpb24gaW5pdEJ1ZmZlcnMoY29uZmlnKSB7XG5cdHZhciBsZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbExlZnQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikuc2Nyb2xsTGVmdCAlIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCAtIGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0ICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoLFxuXHRcdHJpZ2h0ID0gY29uZmlnLnRhYmxlV2lkdGggLSBsZWZ0LFxuXHRcdHRvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5zY3JvbGxUb3AsXG5cdFx0Ym90dG9tID0gY29uZmlnLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGxlZnQgPSBsZWZ0ID4gY29uZmlnLnRhYmxlV2lkdGggPyBjb25maWcudGFibGVXaWR0aCA6IGxlZnQ7XG5cdGxlZnQgPSBsZWZ0IDwgY29uZmlnLmlubmVyLm1pbkJ1ZmZlcldpZHRoID8gY29uZmlnLmlubmVyLm1pbkJ1ZmZlcldpZHRoIDogbGVmdDtcblx0cmlnaHQgPSBjb25maWcudGFibGVXaWR0aCAtIGxlZnQ7XG5cdHRvcCA9IHRvcCArIGNvbmZpZy5pbm5lci5taW5CdWZmZXJIZWlnaHQgPiBjb25maWcudGFibGVIZWlnaHQgPyBjb25maWcudGFibGVIZWlnaHQgKyBjb25maWcuaW5uZXIubWluQnVmZmVySGVpZ2h0IDogdG9wICsgY29uZmlnLmlubmVyLm1pbkJ1ZmZlckhlaWdodDtcblx0Ym90dG9tID0gY29uZmlnLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCA9IE1hdGguZmxvb3IobGVmdCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCk7XG5cdGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcigodG9wIC0gdG9wICUgY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCkgLyBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KTtcblxuXHRjb25maWcuaW5uZXIuYnVmZmVyTGVmdC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSBsZWZ0ICsgJ3B4Jztcblx0fSk7XG5cdGNvbmZpZy5pbm5lci5idWZmZXJSaWdodC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSByaWdodCArICdweCc7XG5cdH0pO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyVG9wLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5oZWlnaHQgPSB0b3AgKyAncHgnO1xuXHR9KTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlckJvdHRvbS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUuaGVpZ2h0ID0gYm90dG9tICsgJ3B4Jztcblx0fSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0VGFibGU6IGluaXRUYWJsZSxcblx0aW5pdENvbnRhaW5lcnM6IGluaXRDb250YWluZXJzLFxuXHRpbml0QnVmZmVyczogaW5pdEJ1ZmZlcnNcbn07XG59LHtcIi4vZG9tXCI6MTB9XSwxNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBDZWxsID0gcmVxdWlyZSgnLi4vbW9kZWxzL2NlbGwnKTtcblxuZnVuY3Rpb24gZ2V0Q2VsbChjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyKSB7XG5cdHZhciBjZWxsT2JqID0gY29uZmlnLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IHJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNvbHVtbk51bWJlcjtcblx0XHR9KSxcblx0XHRyb3dPYmogPSBjb25maWcuaGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGlmICh0eXBlb2YgY2VsbE9iaiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNlbGxPYmogPSBuZXcgQ2VsbCh7XG5cdFx0XHRrZXk6IHJvd09ialtjb2x1bW5OdW1iZXJdLmtleSxcblx0XHRcdHZhbHVlOiBjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV1cblx0XHR9KTtcblxuXHRcdGNlbGxPYmoudXBkYXRlQXR0cmlidXRlcyh7XG5cdFx0XHRyb3dOdW1iZXI6IHJvd051bWJlcixcblx0XHRcdGNvbHVtbk51bWJlcjogY29sdW1uTnVtYmVyXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gY2VsbE9iajtcbn1cblxuZnVuY3Rpb24gZ2V0Rml4ZWRDZWxsKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpIHtcblx0dmFyIGNlbGxPYmogPSBudWxsLFxuXHRcdHJvd09iaiA9IGNvbmZpZy5maXhlZEhlYWRlcnNbY29uZmlnLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjZWxsT2JqID0gbmV3IENlbGwoe1xuXHRcdGtleTogcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5LFxuXHRcdHZhbHVlOiBjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV1cblx0fSk7XG5cblx0cmV0dXJuIGNlbGxPYmo7XG59XG5cbmZ1bmN0aW9uIHNldENlbGxWYWx1ZShjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyLCB2YWx1ZSkge1xuXHR2YXIgcm93T2JqID0gY29uZmlnLmhlYWRlcnNbY29uZmlnLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNDZWxsQ2hhbmdlZChjb25maWcsIGNlbGxPYmopIHtcblx0dmFyIG9yaWdpbmFsT2JqID0gZ2V0Q2VsbChjb25maWcsIGNlbGxPYmoucm93TnVtYmVyLCBjZWxsT2JqLmNvbHVtbk51bWJlciksXG5cdFx0ZWRpdGVkT2JqID0gY29uZmlnLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdFx0fSksXG5cdFx0b3JpZ2luYWxWYWwgPSBvcmlnaW5hbE9iai52YWx1ZSB8fCAnJztcblxuXHRyZXR1cm4gb3JpZ2luYWxWYWwgIT09IGNlbGxPYmoudmFsdWUgfHwgdHlwZW9mIGVkaXRlZE9iaiAhPSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gc2V0VXBkYXRlZENlbGxWYWx1ZShjb25maWcsIGNlbGxPYmopIHtcblx0dmFyIHByZXYgPSBjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdH0pO1xuXG5cdGlmICh0eXBlb2YgcHJldiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscy5wdXNoKGNlbGxPYmopO1xuXHR9IGVsc2Uge1xuXHRcdHByZXYudmFsdWUgPSBjZWxsT2JqLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRDZWxsOiBnZXRDZWxsLFxuXHRnZXRGaXhlZENlbGw6IGdldEZpeGVkQ2VsbCxcblx0c2V0Q2VsbFZhbHVlOiBzZXRDZWxsVmFsdWUsXG5cdGlzQ2VsbENoYW5nZWQ6IGlzQ2VsbENoYW5nZWQsXG5cdHNldFVwZGF0ZWRDZWxsVmFsdWU6IHNldFVwZGF0ZWRDZWxsVmFsdWVcbn07XG59LHtcIi4uL21vZGVscy9jZWxsXCI6Mn1dfSx7fSxbMV0pO1xuIl0sImZpbGUiOiJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJ9
