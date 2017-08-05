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
		dataCell: 'data-cell',
		sortColumn: 'sort-column',
		sortIcon: 'sort-icon'
	},
	icons: {
		sort: {
			inc: 'sort-asc',
			desc: 'sort-desc'
		}
	},
	sort: { },
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
				cell.innerHTML = getHeaderCellHtml(config, cell, cellObj);
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

function getHeaderCellHtml(config, cell, cellObj) {
	var innerHTML = '',
		columnText = cellObj.text || cellObj.key || '';

	if (config.sort.enabled) {
		var attribute = cellObj.key,
			direction = config.inner.sort.attribute === attribute ? config.inner.sort.direction : 'none',
			isSorted = direction !== 'none',
			arrowClass = direction === 'down' ? config.inner.icons.sort.asc : config.inner.icons.sort.desc,
			iconClass = config.inner.selectors.sortIcon + (isSorted ? ' ' + arrowClass : '');

		innerHTML += '<span class="' + iconClass + '">' + (isSorted ? direction : '') + ' </span>';

		cell.setAttribute('data-direction', direction);
		cell.setAttribute('data-attribute', attribute);
	}

	innerHTML += columnText;

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
},{"./table":15}],11:[function(require,module,exports){
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
},{"../models/event-arguments":3,"./dom":10,"./table":15}],12:[function(require,module,exports){
'use strict';

var EventArguments = require('../models/event-arguments');

var domUtil = require('../utils/dom'),
	tableUtil = require('../utils/table'),
	editUtil = require('../utils/edit'),
	generatorUtil = require('../utils/generator'),
	sortUtil = require('../utils/sort');

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

function onClickSortHeader(event, config) {
	var sortColumnSelector = '.' + config.inner.selectors.sortColumn,
		sortIconSelector = sortColumnSelector + ' .' + config.inner.selectors.sortIcon;

	if (!event.target.matches(sortColumnSelector) &&
		!event.target.matches(sortIconSelector)) {
		return;
	}

	if (event.target.matches(sortIconSelector)) {
		sortUtil.sortByColumn(config, event.target.parentNode);
	}

	if (event.target.matches(sortColumnSelector)) {
		sortUtil.sortByColumn(config, event.target);
	}
}

function addEvents(config) {
	container = document.querySelector('.' + config.selectors.virtualContainer);

	instances.onScrollEventHandler = function(event) { onScrollEventHandler(event, config); };
	instances.onClickCellEventHandler = function(event) { onClickCellEventHandler(event, config); };
	instances.onClickSaveButtonEventHandler = function(event) { onClickSaveButtonEventHandler(event, config); };
	instances.onClickSortHeader = function(event) { onClickSortHeader(event, config); };

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

	if (config.sort.enabled) {
		document.addEventListener('click', instances.onClickSortHeader);
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

	if (config.sort.enabled) {
		document.removeEventListener('click', instances.onClickSortHeader);
	}
}

module.exports = {
	addEvents: addEvents,
	removeEvents: removeEvents
};
},{"../models/event-arguments":3,"../utils/dom":10,"../utils/edit":11,"../utils/generator":13,"../utils/sort":14,"../utils/table":15}],13:[function(require,module,exports){
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
			tdElement.innerHTML = domUtil.getHeaderCellHtml(config, tdElement, headerRow[j]);

			if (config.sort.enabled) {
				tdElement.classList.add(config.inner.selectors.sortColumn);
			}

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

var domUtil = require('./dom');

function defaultCompare(a, b, attribute, isDown) {
	var attrA = a[attribute],
		attrB = b[attribute];

	if (typeof attrA == 'undefined' && typeof attrB != 'undefined' || attrA < attrB) {
		return isDown ? -1 : 1;
	}

	if (typeof attrA != 'undefined' && typeof attrB == 'undefined' || attrA > attrB) {
		return isDown ? 1 : -1;
	}

	return 0;
}

function sortByColumn(config, column) {
	var direction = column.getAttribute('data-direction'),
		attribute = column.getAttribute('data-attribute');

	if (direction === 'none' || direction === 'down') {
		direction = 'up';
	} else {
		direction = 'down';
	}

	config.inner.sort.direction = direction;
	config.inner.sort.attribute = attribute;
	config.dataSource.sort(function(a, b) { return defaultCompare(a, b, attribute, direction === 'down'); });

	domUtil.updateTable(config);
}

function resetSort(config) {
	if (typeof config.sort.default == 'undefined') {
		return;
	}

	config.inner.sort.direction = 'asc';
	config.inner.sort.attribute = config.sort.default;
	config.dataSource.sort(function(a, b) { return defaultCompare(a, b, config.sort.default, true); });

	domUtil.updateTable(config);
}

module.exports = {
	sortByColumn: sortByColumn,
	resetSort: resetSort
};
},{"./dom":10}],15:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJy4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzJyk7cmVxdWlyZSgnLi9wb2xseWZpbGxzL05vZGVMaXN0LmZvckVhY2guanMnKTtcblxudmFyIFZpcnR1YWxEYXRhR3JpZCA9IHJlcXVpcmUoJy4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkJyk7XG5cbndpbmRvdy5WaXJ0dWFsRGF0YUdyaWQgPSBWaXJ0dWFsRGF0YUdyaWQ7XG59LHtcIi4vbW9kZWxzL3ZpcnR1YWwtZGF0YS1ncmlkXCI6NCxcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NyxcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6OH1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsT2JqZWN0KHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdrZXknKTtcblx0aW5pdEF0dHIoJ3ZhbHVlJyk7XG5cdGluaXRBdHRyKCdjbGFzcycpO1xuXHRpbml0QXR0cigncm93TnVtYmVyJyk7XG5cdGluaXRBdHRyKCdjb2x1bW5OdW1iZXInKTtcblxuXHRmdW5jdGlvbiBpbml0QXR0cihuYW1lKSB7XG5cdFx0c2VsZltuYW1lXSA9IHR5cGVvZiBwID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBwW25hbWVdID09ICd1bmRlZmluZWQnID8gbnVsbCA6IHBbbmFtZV07XG5cdH1cblxuXHR0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycykge1xuXHRcdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcblx0XHRcdGlmICh0eXBlb2YgYXR0cnNba10gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGZba10gIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0c2VsZltrXSA9IGF0dHJzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxPYmplY3Q7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRBcmd1bWVudHMocCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aW5pdEF0dHIoJ2NlbGwnKTtcblx0aW5pdEF0dHIoJ2NlbGxPYmplY3QnKTtcblx0aW5pdEF0dHIoJ2NhbmNlbEV2ZW50Jyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEFyZ3VtZW50cztcbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9nZW5lcmF0b3InKTtcblxudmFyIHVuaXF1ZUlkU2VxdWVuY2UgPSAxO1xuXG5mdW5jdGlvbiBWaXJ0dWFsRGF0YUdyaWQoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmNvbmZpZ3VyYXRpb24gPSB7fTtcblx0c2VsZi51bmlxdWVJZCA9IHVuaXF1ZUlkU2VxdWVuY2UrKztcblx0c2VsZi5nZW5lcmF0ZVRhYmxlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdGdlbmVyYXRvci5nZW5lcmF0ZVRhYmxlKHNlbGYuY29uZmlndXJhdGlvbiwgb3B0aW9ucyk7XG5cdH07XG5cdHNlbGYuZGVzdHJveVRhYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0Z2VuZXJhdG9yLmRlc3Ryb3lUYWJsZShzZWxmLmNvbmZpZ3VyYXRpb24pO1xuXHR9O1xuXHRzZWxmLmdldElkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlbGYudW5pcXVlSWQ7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlydHVhbERhdGFHcmlkO1xufSx7XCIuLi9tb2R1bGVzL2dlbmVyYXRvclwiOjZ9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ1V0aWwgPSByZXF1aXJlKCcuLi91dGlscy9jb25maWd1cmF0aW9uJyksXG5cdGdlbmVyYXRvclV0aWwgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0b3InKTtcblxudmFyIERFRkFVTFRTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRtYWluQ29udGFpbmVyOiAnLmRhdGEtY29udGFpbmVyJyxcblx0XHRmaXhlZENvbnRhaW5lcjogJ2ZpeGVkLWNvbnRhaW5lcicsXG5cdFx0Zml4ZWRUYWJsZTogJ2ZpeGVkLXRhYmxlJyxcblx0XHR2aXJ0dWFsQ29udGFpbmVyOiAndmlydHVhbC1jb250YWluZXInLFxuXHRcdHZpcnR1YWxUYWJsZTogJ3ZpcnR1YWwtdGFibGUnLFxuXHRcdGVkaXRpbmdDZWxsOiAnZWRpdGluZy1jZWxsJyxcblx0XHRlZGl0ZWRDZWxsOiAnZWRpdGVkLWNlbGwnLFxuXHRcdHNhdmVCdXR0b246IG51bGxcblx0fSxcblx0ZGltZW5zaW9uczoge1xuXHRcdGNlbGxXaWR0aDogMTUwLFxuXHRcdGNlbGxIZWlnaHQ6IDUwLFxuXHRcdGNvbnRhaW5lckhlaWdodDogY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHR9LFxuXHRlZGl0OiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0ZmlsdGVyOiB7XG5cdFx0ZW5hYmxlZDogZmFsc2Vcblx0fSxcblx0c29ydDoge1xuXHRcdGVuYWJsZWQ6IHRydWVcblx0fSxcblx0ZXZlbnRIYW5kbGVyczoge1xuXHRcdG9uQmVmb3JlRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25WYWxpZGF0aW9uOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdFx0b25CZWZvcmVTYXZlOiBjb25maWdVdGlsLm5pbCxcblx0XHRvbkFmdGVyU2F2ZTogY29uZmlnVXRpbC5uaWxcblx0fSxcblx0ZGF0YVNvdXJjZTogWyBdLFxuXHRoZWFkZXJzOiBbIFsgXSBdLFxuXHRmaXhlZEhlYWRlcnM6IFsgWyBdIF0sXG5cdGRlYnVnOiBmYWxzZSxcblx0aW5uZXI6IHt9XG59O1xuXG52YXIgU1RBVElDX0lOTkVSX0FUVFJTID0ge1xuXHRzZWxlY3RvcnM6IHtcblx0XHRidWZmZXJSb3dUb3A6ICdidWZmZXItcm93LXRvcCcsXG5cdFx0YnVmZmVyUm93Qm90dG9tOiAnYnVmZmVyLXJvdy1ib3R0b20nLFxuXHRcdGJ1ZmZlckNvbHVtbkxlZnQ6ICdidWZmZXItY29sdW1uLWxlZnQnLFxuXHRcdGJ1ZmZlckNvbHVtblJpZ2h0OiAnYnVmZmVyLWNvbHVtbi1yaWdodCcsXG5cdFx0aGVhZGVyUm93OiAnaGVhZGVyLXJvdycsXG5cdFx0aGVhZGVyQ2VsbDogJ2hlYWRlci1jZWxsJyxcblx0XHRkYXRhUm93OiAnZGF0YS1yb3cnLFxuXHRcdGRhdGFDZWxsOiAnZGF0YS1jZWxsJyxcblx0XHRzb3J0Q29sdW1uOiAnc29ydC1jb2x1bW4nLFxuXHRcdHNvcnRJY29uOiAnc29ydC1pY29uJ1xuXHR9LFxuXHRpY29uczoge1xuXHRcdHNvcnQ6IHtcblx0XHRcdGluYzogJ3NvcnQtYXNjJyxcblx0XHRcdGRlc2M6ICdzb3J0LWRlc2MnXG5cdFx0fVxuXHR9LFxuXHRzb3J0OiB7IH0sXG5cdG1pbkJ1ZmZlcldpZHRoOiAyLFxuXHRtaW5CdWZmZXJIZWlnaHQ6IDIsIC8vIEF6w6lydCB2YW4gcsOhIHN6w7xrc8OpZywgbWVydCBoYSBuaW5jcyBtZWdhZHZhLCBha2tvciB1Z3JpayBlZ3lldHQgYSBzY3JvbGwgaGEgYSB2w6lnw6lyZSB2YWd5IGF6IGVsZWrDqXJlIMOpcnTDvG5rIGEgdMOhYmzDoXphdGJhblxuXHRsZWZ0Q2VsbE9mZnNldDogMCxcblx0dG9wQ2VsbE9mZnNldDogMCxcblx0ZWRpdGVkQ2VsbHM6IFtdXG59O1xuXG5mdW5jdGlvbiBpbml0KGNvbmZpZywgb3B0aW9ucykge1xuXHRpbml0Q29uZmlnT2JqZWN0KGNvbmZpZyk7XG5cblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLm1haW5Db250YWluZXInKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLmZpeGVkQ29udGFpbmVyJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5maXhlZFRhYmxlJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy52aXJ0dWFsVGFibGUnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc2VsZWN0b3JzLmVkaXRpbmdDZWxsJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5lZGl0ZWRDZWxsJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ3NlbGVjdG9ycy5zYXZlQnV0dG9uJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2RpbWVuc2lvbnMuY2VsbFdpZHRoJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2RpbWVuc2lvbnMuY2VsbEhlaWdodCcpO1xuXG5cdGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoY29uZmlnLCBvcHRpb25zKTtcblxuXHRnZW5lcmF0b3JVdGlsLmluaXRDb250YWluZXJzKGNvbmZpZyk7XG5cblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZGF0YVNvdXJjZScpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdoZWFkZXJzJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2ZpeGVkSGVhZGVycycpO1xuXHR1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsICdlZGl0LmVuYWJsZWQnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZmlsdGVyLmVuYWJsZWQnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnc29ydC5lbmFibGVkJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2RlYnVnJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25CZWZvcmVFZGl0Jyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25WYWxpZGF0aW9uJyk7XG5cdHVwZGF0ZVZhbHVlKGNvbmZpZywgb3B0aW9ucywgJ2V2ZW50SGFuZGxlcnMub25BZnRlckVkaXQnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZXZlbnRIYW5kbGVycy5vbkJlZm9yZVNhdmUnKTtcblx0dXBkYXRlVmFsdWUoY29uZmlnLCBvcHRpb25zLCAnZXZlbnRIYW5kbGVycy5vbkFmdGVyU2F2ZScpO1xuXG5cdGluaXRJbm5lckNhbGN1bGF0ZWRWYWx1ZXMoY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gaW5pdENvbmZpZ09iamVjdChjb25maWcpIHtcblx0Y29uZmlnLnNlbGVjdG9ycyA9IHt9O1xuXHRjb25maWcuZXZlbnRIYW5kbGVycyA9IHt9O1xuXHRjb25maWcuaW5uZXIgPSBPYmplY3QuYXNzaWduKHt9LCBTVEFUSUNfSU5ORVJfQVRUUlMpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGNvbmZpZywgb3B0aW9ucykge1xuXHR2YXIgY29udGFpbmVySGVpZ2h0ID0gZ2V0SW5uZXJWYWx1ZShvcHRpb25zLCAnZGltZW5zaW9ucy5jb250YWluZXJIZWlnaHQnKTtcblxuXHRpZiAodHlwZW9mIGNvbnRhaW5lckhlaWdodCA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbnRhaW5lckhlaWdodCA9IGNvbmZpZ1V0aWwuZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodChjb25maWcpO1xuXHR9XG5cblx0Y29uZmlnLmRpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0ID0gY29uZmlnVXRpbC5jYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGNvbmZpZywgY29udGFpbmVySGVpZ2h0KTtcbn1cblxuZnVuY3Rpb24gaW5pdElubmVyQ2FsY3VsYXRlZFZhbHVlcyhjb25maWcpIHtcblx0Ly8gQW5uYWsgYSBoZWFkZXIgc29ybmFrIGF6IGluZGV4ZSwgYW1pIGEgY2VsbGEga3VsY3Nva2F0IGlzIG1lZ2hhdMOhcm96emEuIE1pdmVsIGV6IG1pbmRpZyBheiB1dG9sc8OzIGxlc3osIGV6w6lydCBUT0RPOiBLaXN6ZWRuaS/DoXRhbGFrw610YW5pXG5cdGNvbmZpZy5pbm5lci5pbmRleE9mQ2VsbEtleUhlYWRlciA9IGNvbmZpZ1V0aWwuZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIoY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLmNvbHNwYW5PZmZzZXQgPSBjb25maWdVdGlsLmdldE1heENvbHNwYW4oY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXIgPSBjb25maWdVdGlsLmdldFZpc2libGVSb3dOdW1iZXIoY29uZmlnKTtcblx0Y29uZmlnLmlubmVyLnZpc2libGVDb2x1bW5OdW1iZXIgPSBjb25maWdVdGlsLmdldFZpc2libGVDb2x1bW5OdW1iZXIoY29uZmlnKTtcblx0Y29uZmlnLnRhYmxlV2lkdGggPSBjb25maWdVdGlsLmdldFRhYmxlV2lkdGgoY29uZmlnKTtcblx0Y29uZmlnLnRhYmxlSGVpZ2h0ID0gY29uZmlnVXRpbC5nZXRUYWJsZUhlaWdodChjb25maWcpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWYWx1ZShjb25maWcsIG9wdGlvbnMsIGtleSkge1xuXHR2YXIgdGFyZ2V0ID0gZ2V0SW5uZXJPYmplY3QoY29uZmlnLCBrZXkpLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cdFx0dmFsdWUgPSBnZXRJbm5lclZhbHVlKG9wdGlvbnMsIGtleSksXG5cdFx0a2V5cyA9IGtleS5zcGxpdCgnLicpLFxuXHRcdGxhc3RLZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAndW5kZWZpbmVkJykge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHR5cGVvZiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpID09ICdmdW5jdGlvbicgPyBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpKGNvbmZpZykgOiBnZXRJbm5lclZhbHVlKERFRkFVTFRTLCBrZXkpO1xuXHR9IGVsc2Uge1xuXHRcdHRhcmdldFtsYXN0S2V5XSA9IHZhbHVlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldElubmVyT2JqZWN0KG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblxuXHR2YXIgc3ViS2V5ID0ga2V5LnNwbGl0KCcuJylbMF0sXG5cdFx0c3ViT2JqZWN0ID0gb2JqZWN0W3N1YktleV07XG5cblx0aWYgKHR5cGVvZiBzdWJPYmplY3QgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRvYmplY3Rbc3ViS2V5XSA9IHt9O1xuXHRcdHN1Yk9iamVjdCA9IG9iamVjdFtzdWJLZXldO1xuXHR9XG5cblx0cmV0dXJuIGdldElubmVyT2JqZWN0KHN1Yk9iamVjdCwga2V5LnN1YnN0cmluZyhrZXkuaW5kZXhPZignLicpICsgMSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbm5lclZhbHVlKG9iamVjdCwga2V5KSB7XG5cdGlmIChrZXkuaW5kZXhPZignLicpID09PSAtMSkge1xuXHRcdHJldHVybiBvYmplY3Rba2V5XTtcblx0fVxuXG5cdHZhciBzdWJLZXkgPSBrZXkuc3BsaXQoJy4nKVswXSxcblx0XHRzdWJPYmplY3QgPSBvYmplY3Rbc3ViS2V5XTtcblxuXHRpZiAodHlwZW9mIHN1Yk9iamVjdCA9PSAndW5kZWZpbmVkJykge1xuXHRcdHJldHVybiBzdWJPYmplY3Q7XG5cdH1cblxuXHRyZXR1cm4gZ2V0SW5uZXJWYWx1ZShzdWJPYmplY3QsIGtleS5zdWJzdHJpbmcoa2V5LmluZGV4T2YoJy4nKSArIDEpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IGluaXRcbn07XG59LHtcIi4uL3V0aWxzL2NvbmZpZ3VyYXRpb25cIjo5LFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTN9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ3VyYXRpb24gICAgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24nKSxcblx0ZXZlbnRIYW5kbGVyVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2V2ZW50LWhhbmRsZXInKSxcblx0Z2VuZXJhdG9yVXRpbCAgICA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpLFxuXHRkb21VdGlsICAgICAgICAgID0gcmVxdWlyZSgnLi4vdXRpbHMvZG9tJyk7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFibGUoY29uZmlnLCBvcHRpb25zKSB7XG5cdGNvbmZpZ3VyYXRpb24uaW5pdChjb25maWcsIG9wdGlvbnMpO1xuXG5cdGdlbmVyYXRvclV0aWwuaW5pdFRhYmxlKGNvbmZpZyk7XG5cdGdlbmVyYXRvclV0aWwuaW5pdEJ1ZmZlcnMoY29uZmlnKTtcblxuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKGNvbmZpZyk7XG5cblx0ZXZlbnRIYW5kbGVyVXRpbC5hZGRFdmVudHMoY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveVRhYmxlKGNvbmZpZykge1xuXHRldmVudEhhbmRsZXJVdGlsLnJlbW92ZUV2ZW50cyhjb25maWcpO1xuXHRkb21VdGlsLmRlc3Ryb3lUYWJsZShjb25maWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2VuZXJhdGVUYWJsZTogZ2VuZXJhdGVUYWJsZSxcblx0ZGVzdHJveVRhYmxlOiBkZXN0cm95VGFibGVcbn07XG59LHtcIi4uL3V0aWxzL2RvbVwiOjEwLFwiLi4vdXRpbHMvZXZlbnQtaGFuZGxlclwiOjEyLFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTMsXCIuL2NvbmZpZ3VyYXRpb25cIjo1fV0sNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmlmICh0eXBlb2YgQXJyYXkucHJvdG90eXBlLmZpbmQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0QXJyYXkucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihwcmVkaWNhdGUpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1leHRlbmQtbmF0aXZlXG5cdFx0aWYgKHRoaXMgPT09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5maW5kIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdwcmVkaWNhdGUgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0dmFyIGxpc3QgPSBPYmplY3QodGhpcyk7XG5cdFx0dmFyIGxlbmd0aCA9IGxpc3QubGVuZ3RoID4+PiAwO1xuXHRcdHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuXHRcdHZhciB2YWx1ZTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhbHVlID0gbGlzdFtpXTtcblx0XHRcdGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCkpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB1bmRlZmluZWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZpbmVkXG5cdH07XG59XG59LHt9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuaWYgKCFOb2RlTGlzdC5wcm90b3R5cGUuZm9yRWFjaCkge1xuXHROb2RlTGlzdC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBhcmd1bWVudCkge1xuXHRcdGFyZ3VtZW50ID0gYXJndW1lbnQgfHwgd2luZG93O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKGFyZ3VtZW50LCB0aGlzW2ldLCBpLCB0aGlzKTtcblx0XHR9XG5cdH07XG59XG59LHt9XSw5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWcsIGhlaWdodCkge1xuXHRpZiAodHlwZW9mIGhlaWdodCA9PSAndW5kZWZpbmVkJykge1xuXHRcdHJldHVybiBoZWlnaHQ7XG5cdH1cblxuXHRyZXR1cm4gY29uZmlnLmlubmVyLm1pbkJ1ZmZlckhlaWdodCAqIDIgKyBNYXRoLmZsb29yKGhlaWdodCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQpICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdENvbnRhaW5lckhlaWdodChjb25maWcpIHtcblx0cmV0dXJuIGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoY29uZmlnLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbmZpZy5zZWxlY3RvcnMubWFpbkNvbnRhaW5lcikuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gNjQpO1xufVxuXG5mdW5jdGlvbiBnZXRJbmRleE9mQ2VsbEtleUhlYWRlcihjb25maWcpIHtcblx0cmV0dXJuIGNvbmZpZy5oZWFkZXJzLmxlbmd0aCAtIDE7XG59XG5cbmZ1bmN0aW9uIGdldE1heENvbHNwYW4oY29uZmlnKSB7XG5cdHZhciBtYXhWYWwgPSAwO1xuXG5cdGNvbmZpZy5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdGVsZW1lbnQuZm9yRWFjaChmdW5jdGlvbihzdWJFbGVtZW50KSB7XG5cdFx0XHRpZiAodHlwZW9mIHN1YkVsZW1lbnQuY29sc3BhbiAhPSAndW5kZWZpbmVkJyAmJiBtYXhWYWwgPCBzdWJFbGVtZW50LmNvbHNwYW4pIHtcblx0XHRcdFx0bWF4VmFsID0gc3ViRWxlbWVudC5jb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHRyZXR1cm4gbWF4VmFsO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlUm93TnVtYmVyKGNvbmZpZykge1xuXHR2YXIgaGFzRmlsdGVyID0gY29uZmlnLmZpbHRlci5lbmFibGVkLFxuXHRcdGNvbnRhaW5lckhlaWdodCA9IGNvbmZpZy5kaW1lbnNpb25zLmNvbnRhaW5lckhlaWdodCAtIGNvbmZpZy5pbm5lci5taW5CdWZmZXJIZWlnaHQgKiAyLFxuXHRcdGRhdGFDZWxscyA9IE1hdGguZmxvb3IoY29udGFpbmVySGVpZ2h0IC8gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCksXG5cdFx0aGVhZGVyQ2VsbHMgPSBjb25maWcuaGVhZGVycy5sZW5ndGggKyAoaGFzRmlsdGVyID8gMSA6IDApO1xuXG5cdHJldHVybiBkYXRhQ2VsbHMgLSBoZWFkZXJDZWxscztcbn1cblxuZnVuY3Rpb24gZ2V0VmlzaWJsZUNvbHVtbk51bWJlcihjb25maWcpIHtcblx0cmV0dXJuIE1hdGguZmxvb3IoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLm9mZnNldFdpZHRoIC8gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoICtcblx0XHQoY29uZmlnLmlubmVyLmNvbHNwYW5PZmZzZXQgPiAyID8gY29uZmlnLmlubmVyLmNvbHNwYW5PZmZzZXQgOiAyKSArIGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0KTtcbn1cblxuZnVuY3Rpb24gZ2V0VGFibGVXaWR0aChjb25maWcpIHtcblx0cmV0dXJuIChjb25maWcuaGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdLmxlbmd0aCAtIGNvbmZpZy5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyKSAqIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aDtcbn1cblxuZnVuY3Rpb24gZ2V0VGFibGVIZWlnaHQoY29uZmlnKSB7XG5cdHJldHVybiAoY29uZmlnLmRhdGFTb3VyY2UubGVuZ3RoIC0gY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXIgKyAxKSAqIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQ7XG59XG5cbmZ1bmN0aW9uIG5pbCgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge307XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0OiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0LFxuXHRnZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0OiBnZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHRnZXRJbmRleE9mQ2VsbEtleUhlYWRlcjogZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIsXG5cdGdldE1heENvbHNwYW46IGdldE1heENvbHNwYW4sXG5cdGdldFZpc2libGVSb3dOdW1iZXI6IGdldFZpc2libGVSb3dOdW1iZXIsXG5cdGdldFZpc2libGVDb2x1bW5OdW1iZXI6IGdldFZpc2libGVDb2x1bW5OdW1iZXIsXG5cdGdldFRhYmxlV2lkdGg6IGdldFRhYmxlV2lkdGgsXG5cdGdldFRhYmxlSGVpZ2h0OiBnZXRUYWJsZUhlaWdodCxcblx0bmlsOiBuaWxcbn07XG59LHt9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciB0YWJsZVV0aWwgPSByZXF1aXJlKCcuL3RhYmxlJyk7XG5cbmZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50KGVsZW1lbnQpIHtcblx0dmFyIGNvbGxlY3Rpb24gPSBlbGVtZW50LnBhcmVudE5vZGUuY2hpbGROb2RlcztcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoY29sbGVjdGlvbltpXSA9PT0gZWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDZWxsKGNvbmZpZywgY2VsbCwgY2VsbE9iaikge1xuXHRjZWxsLmlubmVySFRNTCA9IGNlbGxPYmoudmFsdWU7XG5cdGNlbGwuY2xhc3NOYW1lID0gY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCArICcgJyArIChjZWxsT2JqLmNsYXNzIHx8ICcnKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVGFibGUoY29uZmlnKSB7XG5cdHZhciBjb3VudFJvdyA9IDAsXG5cdFx0Y29sc3BhbiA9IDE7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSArICcgdHIuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdykge1xuXHRcdHJvdy5xdWVyeVNlbGVjdG9yQWxsKCd0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwsIGNlbGxOdW1iZXIpIHtcblx0XHRcdHZhciBjZWxsT2JqID0gY29uZmlnLmhlYWRlcnNbY291bnRSb3ddW2NvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCArIGNlbGxOdW1iZXJdO1xuXG5cdFx0XHRpZiAoY29sc3BhbiA+IDEpIHtcblx0XHRcdFx0Y2VsbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRjb2xzcGFuLS07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjZWxsLmlubmVySFRNTCA9IGdldEhlYWRlckNlbGxIdG1sKGNvbmZpZywgY2VsbCwgY2VsbE9iaik7XG5cdFx0XHRcdGNlbGwuc3R5bGUuZGlzcGxheSA9ICd0YWJsZS1jZWxsJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGVvZiBjZWxsT2JqLmNvbHNwYW4gPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Y2VsbC5yZW1vdmVBdHRyaWJ1dGUoJ2NvbHNwYW4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBjYWxjdWxhdGVkQ29sc3BhbiA9IGNvbmZpZy5pbm5lci52aXNpYmxlQ29sdW1uTnVtYmVyIDw9IGNlbGxOdW1iZXIgKyBjZWxsT2JqLmNvbHNwYW4gPyBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlciAtIGNlbGxOdW1iZXIgOiBjZWxsT2JqLmNvbHNwYW47XG5cblx0XHRcdFx0Y2VsbC5zZXRBdHRyaWJ1dGUoJ2NvbHNwYW4nLCBjYWxjdWxhdGVkQ29sc3Bhbik7XG5cdFx0XHRcdGNvbHNwYW4gPSBjYWxjdWxhdGVkQ29sc3Bhbjtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRjb3VudFJvdysrO1xuXHRcdGNvbHNwYW4gPSAxO1xuXHR9KTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ci4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwsIGNlbGxOdW1iZXIpIHtcblx0XHRcdHVwZGF0ZUNlbGwoY29uZmlnLCBjZWxsLCB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWcsIGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjb25maWcuaW5uZXIubGVmdENlbGxPZmZzZXQgKyBjZWxsTnVtYmVyKSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLnNlbGVjdG9ycy5maXhlZFRhYmxlICsgJyB0ci4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KS5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgcm93TnVtYmVyKSB7XG5cdFx0cm93LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RkLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwsIGNlbGxOdW1iZXIpIHtcblx0XHRcdHVwZGF0ZUNlbGwoY29uZmlnLCBjZWxsLCB0YWJsZVV0aWwuZ2V0Rml4ZWRDZWxsKGNvbmZpZywgY29uZmlnLmlubmVyLnRvcENlbGxPZmZzZXQgKyByb3dOdW1iZXIsIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0RWRpdGluZ0NlbGwoY29uZmlnLCBvbklucHV0Qmx1ckV2ZW50SGFuZGxlcikge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlZGl0aW5nQ2VsbCkge1xuXHRcdHZhciBpbnB1dCA9IGVkaXRpbmdDZWxsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG5cblx0XHRpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgb25JbnB1dEJsdXJFdmVudEhhbmRsZXIpO1xuXHRcdGVkaXRpbmdDZWxsLmlubmVySFRNTCA9IGlucHV0LnZhbHVlO1xuXHRcdGVkaXRpbmdDZWxsLmNsYXNzTGlzdC5yZW1vdmUoY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZXNldEVkaXRlZENlbGwoY29uZmlnKSB7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWcuc2VsZWN0b3JzLmVkaXRpbmdDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGVkaXRlZENlbGwpIHtcblx0XHRlZGl0ZWRDZWxsLmNsYXNzTGlzdC5yZW1vdmUoY29uZmlnLnNlbGVjdG9ycy5lZGl0ZWRDZWxsKTtcblx0fSk7XG5cblx0Y29uZmlnLmlubmVyLmVkaXRlZENlbGxzID0gW107XG5cdHVwZGF0ZVRhYmxlKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZShjb25maWcpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuc2VsZWN0b3JzLm1haW5Db250YWluZXIpLmlubmVySFRNTCA9ICcnO1xufVxuXG5mdW5jdGlvbiBnZXRIZWFkZXJDZWxsSHRtbChjb25maWcsIGNlbGwsIGNlbGxPYmopIHtcblx0dmFyIGlubmVySFRNTCA9ICcnLFxuXHRcdGNvbHVtblRleHQgPSBjZWxsT2JqLnRleHQgfHwgY2VsbE9iai5rZXkgfHwgJyc7XG5cblx0aWYgKGNvbmZpZy5zb3J0LmVuYWJsZWQpIHtcblx0XHR2YXIgYXR0cmlidXRlID0gY2VsbE9iai5rZXksXG5cdFx0XHRkaXJlY3Rpb24gPSBjb25maWcuaW5uZXIuc29ydC5hdHRyaWJ1dGUgPT09IGF0dHJpYnV0ZSA/IGNvbmZpZy5pbm5lci5zb3J0LmRpcmVjdGlvbiA6ICdub25lJyxcblx0XHRcdGlzU29ydGVkID0gZGlyZWN0aW9uICE9PSAnbm9uZScsXG5cdFx0XHRhcnJvd0NsYXNzID0gZGlyZWN0aW9uID09PSAnZG93bicgPyBjb25maWcuaW5uZXIuaWNvbnMuc29ydC5hc2MgOiBjb25maWcuaW5uZXIuaWNvbnMuc29ydC5kZXNjLFxuXHRcdFx0aWNvbkNsYXNzID0gY29uZmlnLmlubmVyLnNlbGVjdG9ycy5zb3J0SWNvbiArIChpc1NvcnRlZCA/ICcgJyArIGFycm93Q2xhc3MgOiAnJyk7XG5cblx0XHRpbm5lckhUTUwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGljb25DbGFzcyArICdcIj4nICsgKGlzU29ydGVkID8gZGlyZWN0aW9uIDogJycpICsgJyA8L3NwYW4+JztcblxuXHRcdGNlbGwuc2V0QXR0cmlidXRlKCdkYXRhLWRpcmVjdGlvbicsIGRpcmVjdGlvbik7XG5cdFx0Y2VsbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtYXR0cmlidXRlJywgYXR0cmlidXRlKTtcblx0fVxuXG5cdGlubmVySFRNTCArPSBjb2x1bW5UZXh0O1xuXG5cdHJldHVybiBpbm5lckhUTUw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR1cGRhdGVDZWxsOiB1cGRhdGVDZWxsLFxuXHR1cGRhdGVUYWJsZTogdXBkYXRlVGFibGUsXG5cdHJlc2V0RWRpdGluZ0NlbGw6IHJlc2V0RWRpdGluZ0NlbGwsXG5cdHJlc2V0RWRpdGVkQ2VsbDogcmVzZXRFZGl0ZWRDZWxsLFxuXHRkZXN0cm95VGFibGU6IGRlc3Ryb3lUYWJsZSxcblxuXHRpbmRleE9mRWxlbWVudDogaW5kZXhPZkVsZW1lbnQsXG5cdGdldEhlYWRlckNlbGxIdG1sOiBnZXRIZWFkZXJDZWxsSHRtbFxufTtcbn0se1wiLi90YWJsZVwiOjE1fV0sMTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzJyksXG5cdHRhYmxlVXRpbCA9IHJlcXVpcmUoJy4vdGFibGUnKSxcblx0ZG9tVXRpbCAgID0gcmVxdWlyZSgnLi9kb20nKTtcblxuZnVuY3Rpb24gc2F2ZUNlbGxzKGNvbmZpZykge1xuXHRpZiAoIWNvbmZpZy5lZGl0LmVuYWJsZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbE9iamVjdDogY29uZmlnLmlubmVyLmVkaXRlZENlbGxzLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWcuZXZlbnRIYW5kbGVycy5vbkJlZm9yZVNhdmUoYXJncyk7XG5cblx0aWYgKCFhcmdzLmNhbmNlbEV2ZW50KSB7XG5cdFx0Y29uZmlnLmlubmVyLmVkaXRlZENlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCkge1xuXHRcdFx0dGFibGVVdGlsLnNldENlbGxWYWx1ZShjb25maWcsIGNlbGwucm93TnVtYmVyLCBjZWxsLmNvbHVtbk51bWJlciwgY2VsbC52YWx1ZSk7XG5cdFx0fSk7XG5cdFx0ZG9tVXRpbC5yZXNldEVkaXRlZENlbGwoY29uZmlnKTtcblxuXHRcdGNvbmZpZy5ldmVudEhhbmRsZXJzLm9uQWZ0ZXJTYXZlKGFyZ3MpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzYXZlQ2VsbHM6IHNhdmVDZWxsc1xufTtcbn0se1wiLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50c1wiOjMsXCIuL2RvbVwiOjEwLFwiLi90YWJsZVwiOjE1fV0sMTI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzJyk7XG5cbnZhciBkb21VdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZG9tJyksXG5cdHRhYmxlVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL3RhYmxlJyksXG5cdGVkaXRVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZWRpdCcpLFxuXHRnZW5lcmF0b3JVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2VuZXJhdG9yJyksXG5cdHNvcnRVdGlsID0gcmVxdWlyZSgnLi4vdXRpbHMvc29ydCcpO1xuXG52YXIgY29udGFpbmVyO1xuXG52YXIgaW5zdGFuY2VzID0ge1xuXHRvblNjcm9sbEV2ZW50SGFuZGxlcjogZnVuY3Rpb24oKSB7fSxcblx0b25JbnB1dEJsdXJFdmVudEhhbmRsZXI6IGZ1bmN0aW9uKCkge30sXG5cdG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyOiBmdW5jdGlvbigpIHt9LFxuXHRvbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcjogZnVuY3Rpb24oKSB7fVxufTtcblxuZnVuY3Rpb24gb25XaGVlbEV2ZW50SGFuZGxlcihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdGNvbnRhaW5lci5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZO1xuXHRjb250YWluZXIuc2Nyb2xsTGVmdCArPSBldmVudC5kZWx0YVg7XG59XG5cbmZ1bmN0aW9uIG9uU2Nyb2xsRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpIHtcblx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0Z2VuZXJhdG9yVXRpbC5pbml0QnVmZmVycyhjb25maWcpO1xuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpIHtcblx0dmFyIGNlbGwgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZSxcblx0XHRyb3dOdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwucGFyZW50Tm9kZSkgKyBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwpIC0gMSArIGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCxcblx0XHRlZGl0ZWRPYmogPSB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyKTtcblxuXHRlZGl0ZWRPYmoudXBkYXRlQXR0cmlidXRlcyh7XG5cdFx0dmFsdWU6IGV2ZW50LnRhcmdldC52YWx1ZSxcblx0XHRjbGFzczogY29uZmlnLnNlbGVjdG9ycy5lZGl0ZWRDZWxsXG5cdH0pO1xuXG5cdGlmICghdGFibGVVdGlsLmlzQ2VsbENoYW5nZWQoY29uZmlnLCBlZGl0ZWRPYmopKSB7XG5cdFx0ZG9tVXRpbC5yZXNldEVkaXRpbmdDZWxsKGNvbmZpZywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsOiBjZWxsLFxuXHRcdGNlbGxPYmplY3Q6IGVkaXRlZE9iaixcblx0XHRjYW5jZWxFdmVudDogZmFsc2Vcblx0fSk7XG5cblx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25WYWxpZGF0aW9uKGFyZ3MpO1xuXG5cdGlmIChhcmdzLmNhbmNlbEVkaXQgIT09IHRydWUpIHtcblx0XHR0YWJsZVV0aWwuc2V0VXBkYXRlZENlbGxWYWx1ZShjb25maWcsIGFyZ3MuY2VsbE9iamVjdCk7XG5cdFx0ZG9tVXRpbC51cGRhdGVDZWxsKGNvbmZpZywgYXJncy5jZWxsLCBhcmdzLmNlbGxPYmplY3QpO1xuXG5cdFx0Y29uZmlnLmV2ZW50SGFuZGxlcnMub25BZnRlckVkaXQoYXJncyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DbGlja0NlbGxFdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZykge1xuXHRpZiAoIWNvbmZpZy5lZGl0LmVuYWJsZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgcm93TnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudChldmVudC50YXJnZXQucGFyZW50Tm9kZSkgKyBjb25maWcuaW5uZXIudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGV2ZW50LnRhcmdldCkgLSAxICsgY29uZmlnLmlubmVyLmxlZnRDZWxsT2Zmc2V0LFxuXHRcdGVkaXRlZE9iaiA9IHRhYmxlVXRpbC5nZXRDZWxsKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpLFxuXHRcdGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuXHRpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG5cdHZhciBhcmdzID0gbmV3IEV2ZW50QXJndW1lbnRzKHtcblx0XHRjZWxsOiBldmVudC50YXJnZXQsXG5cdFx0Y2VsbE9iamVjdDogZWRpdGVkT2JqLFxuXHRcdGNhbmNlbEV2ZW50OiBmYWxzZVxuXHR9KTtcblxuXHRjb25maWcuZXZlbnRIYW5kbGVycy5vbkJlZm9yZUVkaXQoYXJncyk7XG5cblx0aWYgKCFhcmdzLmNhbmNlbEV2ZW50KSB7XG5cdFx0ZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoY29uZmlnLnNlbGVjdG9ycy5lZGl0aW5nQ2VsbCk7XG5cdFx0ZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoY29uZmlnLnNlbGVjdG9ycy5lZGl0ZWRDZWxsKTtcblx0XHRldmVudC50YXJnZXQuaW5uZXJIVE1MID0gJyc7XG5cdFx0ZXZlbnQudGFyZ2V0LmFwcGVuZENoaWxkKGlucHV0KTtcblxuXHRcdGluc3RhbmNlcy5vbklucHV0Qmx1ckV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7IG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKGV2LCBjb25maWcpOyB9O1xuXG5cdFx0aW5wdXQuZm9jdXMoKTtcblx0XHRpbnB1dC52YWx1ZSA9IGVkaXRlZE9iai52YWx1ZTtcblx0XHRpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaW5zdGFuY2VzLm9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0fVxufVxuXG5mdW5jdGlvbiBvbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKSB7XG5cdGVkaXRVdGlsLnNhdmVDZWxscyhjb25maWcpO1xufVxuXG5mdW5jdGlvbiBvbkNsaWNrU29ydEhlYWRlcihldmVudCwgY29uZmlnKSB7XG5cdHZhciBzb3J0Q29sdW1uU2VsZWN0b3IgPSAnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLnNvcnRDb2x1bW4sXG5cdFx0c29ydEljb25TZWxlY3RvciA9IHNvcnRDb2x1bW5TZWxlY3RvciArICcgLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLnNvcnRJY29uO1xuXG5cdGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoc29ydENvbHVtblNlbGVjdG9yKSAmJlxuXHRcdCFldmVudC50YXJnZXQubWF0Y2hlcyhzb3J0SWNvblNlbGVjdG9yKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmIChldmVudC50YXJnZXQubWF0Y2hlcyhzb3J0SWNvblNlbGVjdG9yKSkge1xuXHRcdHNvcnRVdGlsLnNvcnRCeUNvbHVtbihjb25maWcsIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlKTtcblx0fVxuXG5cdGlmIChldmVudC50YXJnZXQubWF0Y2hlcyhzb3J0Q29sdW1uU2VsZWN0b3IpKSB7XG5cdFx0c29ydFV0aWwuc29ydEJ5Q29sdW1uKGNvbmZpZywgZXZlbnQudGFyZ2V0KTtcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRFdmVudHMoY29uZmlnKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKTtcblxuXHRpbnN0YW5jZXMub25TY3JvbGxFdmVudEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkgeyBvblNjcm9sbEV2ZW50SGFuZGxlcihldmVudCwgY29uZmlnKTsgfTtcblx0aW5zdGFuY2VzLm9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHsgb25DbGlja0NlbGxFdmVudEhhbmRsZXIoZXZlbnQsIGNvbmZpZyk7IH07XG5cdGluc3RhbmNlcy5vbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7IG9uQ2xpY2tTYXZlQnV0dG9uRXZlbnRIYW5kbGVyKGV2ZW50LCBjb25maWcpOyB9O1xuXHRpbnN0YW5jZXMub25DbGlja1NvcnRIZWFkZXIgPSBmdW5jdGlvbihldmVudCkgeyBvbkNsaWNrU29ydEhlYWRlcihldmVudCwgY29uZmlnKTsgfTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlciwgeyBwYXNzaXZlOiBmYWxzZSwgY2FwdHVyZTogdHJ1ZSB9KTtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaW5zdGFuY2VzLm9uU2Nyb2xsRXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGlmIChjb25maWcuZWRpdC5lbmFibGVkICYmIGNvbmZpZy5zZWxlY3RvcnMuc2F2ZUJ1dHRvbiAhPT0gbnVsbCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnLnNlbGVjdG9ycy5zYXZlQnV0dG9uKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGluc3RhbmNlcy5vbkNsaWNrU2F2ZUJ1dHRvbkV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRpZiAoY29uZmlnLmVkaXQuZW5hYmxlZCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsVGFibGUgKyAnIHRkLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmRhdGFDZWxsKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGluc3RhbmNlcy5vbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcik7XG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoY29uZmlnLnNvcnQuZW5hYmxlZCkge1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW5zdGFuY2VzLm9uQ2xpY2tTb3J0SGVhZGVyKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudHMoY29uZmlnKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlcik7XG5cdFx0Y29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGluc3RhbmNlcy5vblNjcm9sbEV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRpZiAoY29uZmlnLmVkaXQuZW5hYmxlZCAmJiBjb25maWcuc2VsZWN0b3JzLnNhdmVCdXR0b24gIT09IG51bGwpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGNvbmZpZy5zZWxlY3RvcnMuc2F2ZUJ1dHRvbikucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbnN0YW5jZXMub25DbGlja1NhdmVCdXR0b25FdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZy5lZGl0LmVuYWJsZWQpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlICsgJyB0ZC4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbnN0YW5jZXMub25DbGlja0NlbGxFdmVudEhhbmRsZXIpO1xuXHRcdH0pO1xuXHR9XG5cblx0aWYgKGNvbmZpZy5zb3J0LmVuYWJsZWQpIHtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGluc3RhbmNlcy5vbkNsaWNrU29ydEhlYWRlcik7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGFkZEV2ZW50czogYWRkRXZlbnRzLFxuXHRyZW1vdmVFdmVudHM6IHJlbW92ZUV2ZW50c1xufTtcbn0se1wiLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50c1wiOjMsXCIuLi91dGlscy9kb21cIjoxMCxcIi4uL3V0aWxzL2VkaXRcIjoxMSxcIi4uL3V0aWxzL2dlbmVyYXRvclwiOjEzLFwiLi4vdXRpbHMvc29ydFwiOjE0LFwiLi4vdXRpbHMvdGFibGVcIjoxNX1dLDEzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGRvbVV0aWwgPSByZXF1aXJlKCcuL2RvbScpO1xuXG5mdW5jdGlvbiBpbml0Q29udGFpbmVycyhjb25maWcpIHtcblx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnLnNlbGVjdG9ycy5tYWluQ29udGFpbmVyKSxcblx0XHR2aXJ0dWFsQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0dmlydHVhbFRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKSxcblx0XHRmaXhlZENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdGZpeGVkVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpO1xuXG5cdHZpcnR1YWxDb250YWluZXIuY2xhc3NMaXN0LmFkZChjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsVGFibGUuY2xhc3NMaXN0LmFkZChjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxUYWJsZSk7XG5cdGZpeGVkQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29uZmlnLnNlbGVjdG9ycy5maXhlZENvbnRhaW5lcik7XG5cdGZpeGVkVGFibGUuY2xhc3NMaXN0LmFkZChjb25maWcuc2VsZWN0b3JzLmZpeGVkVGFibGUpO1xuXG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZChmaXhlZENvbnRhaW5lcik7XG5cdGZpeGVkQ29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkVGFibGUpO1xuXG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCh2aXJ0dWFsQ29udGFpbmVyKTtcblx0dmlydHVhbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2aXJ0dWFsVGFibGUpO1xuXG5cdHZpcnR1YWxDb250YWluZXIuc3R5bGUubWF4SGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY29udGFpbmVySGVpZ2h0ICsgJ3B4Jztcblx0dmlydHVhbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuXG5cdGZpeGVkQ29udGFpbmVyLnN0eWxlLnBhZGRpbmcgPSBjb25maWcuaW5uZXIubWluQnVmZmVySGVpZ2h0ICsgJ3B4IDAnO1xuXHRmaXhlZENvbnRhaW5lci5zdHlsZS5mbG9hdCA9ICdsZWZ0Jztcbn1cblxuZnVuY3Rpb24gaW5pdFRhYmxlKGNvbmZpZykge1xuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIHRhYmxlXG5cdHZhciB2aXJ0dWFsVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdHZpcnR1YWxUYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rib2R5JyksXG5cdFx0dHJIZWFkQnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuXHR0ckhlYWRCdWZmZXIuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblxuXHR2YXIgaSwgaiwgdHJIZWFkLCB0ckJvZHksIGJ1ZmZlckNvbHVtbkxlZnQsIGJ1ZmZlckNvbHVtblJpZ2h0LCBidWZmZXJSb3dCb3R0b20sIHRkRWxlbWVudDtcblxuXHQvLyBHZW5lcmF0ZSB2aXJ0dWFsIGhlYWRlclxuXHRidWZmZXJDb2x1bW5MZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0YnVmZmVyQ29sdW1uTGVmdC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0dHJIZWFkQnVmZmVyLmFwcGVuZENoaWxkKGJ1ZmZlckNvbHVtbkxlZnQpO1xuXG5cdGZvciAoaSA9IDA7IGkgPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaSsrKSB7XG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXHRcdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHR9XG5cblx0YnVmZmVyQ29sdW1uUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5SaWdodC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdHRySGVhZEJ1ZmZlci5hcHBlbmRDaGlsZChidWZmZXJDb2x1bW5SaWdodCk7XG5cblx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZEJ1ZmZlcik7XG5cblx0Y29uZmlnLmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXJSb3cpIHtcblx0XHR0ckhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRySGVhZC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuaGVhZGVyUm93KTtcblx0XHR0ckhlYWQuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5oZWFkZXJDZWxsKTtcblx0XHRcdHRkRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCArICdweCc7XG5cdFx0XHR0ZEVsZW1lbnQuaW5uZXJIVE1MID0gZG9tVXRpbC5nZXRIZWFkZXJDZWxsSHRtbChjb25maWcsIHRkRWxlbWVudCwgaGVhZGVyUm93W2pdKTtcblxuXHRcdFx0aWYgKGNvbmZpZy5zb3J0LmVuYWJsZWQpIHtcblx0XHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5zb3J0Q29sdW1uKTtcblx0XHRcdH1cblxuXHRcdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtblJpZ2h0KTtcblxuXHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXG5cdFx0dmlydHVhbFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH0pO1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgYm9keVxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBjb25maWcuaW5uZXIudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQodHJCb2R5KTtcblx0fVxuXG5cdGJ1ZmZlclJvd0JvdHRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdGJ1ZmZlclJvd0JvdHRvbS5jbGFzc0xpc3QuYWRkKGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyUm93Qm90dG9tKTtcblxuXHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQoYnVmZmVyUm93Qm90dG9tKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGhlYWQpO1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbFRhYmxlKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGJvZHkpO1xuXG5cdGNvbmZpZy5pbm5lci5idWZmZXJMZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlckNvbHVtbkxlZnQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyUmlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZy5pbm5lci5zZWxlY3RvcnMuYnVmZmVyQ29sdW1uUmlnaHQpO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWcuaW5uZXIuc2VsZWN0b3JzLmJ1ZmZlclJvd1RvcENsYXNzKTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlckJvdHRvbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnLmlubmVyLnNlbGVjdG9ycy5idWZmZXJSb3dCb3R0b20pO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIHRhYmxlXG5cblx0aWYgKGNvbmZpZy5maXhlZEhlYWRlcnMubGVuZ3RoID09PSAwIHx8IGNvbmZpZy5maXhlZEhlYWRlcnNbMF0ubGVuZ3RoID09PSAwKSB7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLmZpeGVkVGFibGUpLnJlbW92ZSgpO1xuXG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dmFyIGZpeGVkVGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuXHRcdGZpeGVkVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGhlYWRlclxuXG5cdGZvciAoaSA9IDA7IGkgPCBjb25maWcuZml4ZWRIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHJIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblx0XHR0ckhlYWQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlclJvdyk7XG5cdFx0dHJIZWFkLnN0eWxlLmhlaWdodCA9IGNvbmZpZy5kaW1lbnNpb25zLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGNvbmZpZy5maXhlZEhlYWRlcnNbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb25maWcuaW5uZXIuc2VsZWN0b3JzLmhlYWRlckNlbGwpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBjb25maWcuZml4ZWRIZWFkZXJzW2ldW2pdLnRleHQgfHwgY29uZmlnLmZpeGVkSGVhZGVyc1tpXVtqXS5rZXkgfHwgJyc7XG5cblx0XHRcdHRySGVhZC5hcHBlbmRDaGlsZCh0ZEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGZpeGVkVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkKTtcblx0fVxuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIGJvZHlcblxuXHRmb3IgKGkgPSAwOyBpIDwgY29uZmlnLmlubmVyLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhUm93KTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgY29uZmlnLmZpeGVkSGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29uZmlnLmlubmVyLnNlbGVjdG9ycy5kYXRhQ2VsbCk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBjb25maWcuZGltZW5zaW9ucy5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRib2R5LmFwcGVuZENoaWxkKHRyQm9keSk7XG5cdH1cblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMuZml4ZWRUYWJsZSkuYXBwZW5kQ2hpbGQoZml4ZWRUaGVhZCk7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy5maXhlZFRhYmxlKS5hcHBlbmRDaGlsZChmaXhlZFRib2R5KTtcbn1cblxuZnVuY3Rpb24gaW5pdEJ1ZmZlcnMoY29uZmlnKSB7XG5cdHZhciBsZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBjb25maWcuc2VsZWN0b3JzLnZpcnR1YWxDb250YWluZXIpLnNjcm9sbExlZnQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZy5zZWxlY3RvcnMudmlydHVhbENvbnRhaW5lcikuc2Nyb2xsTGVmdCAlIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCAtIGNvbmZpZy5pbm5lci5jb2xzcGFuT2Zmc2V0ICogY29uZmlnLmRpbWVuc2lvbnMuY2VsbFdpZHRoLFxuXHRcdHJpZ2h0ID0gY29uZmlnLnRhYmxlV2lkdGggLSBsZWZ0LFxuXHRcdHRvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnLnNlbGVjdG9ycy52aXJ0dWFsQ29udGFpbmVyKS5zY3JvbGxUb3AsXG5cdFx0Ym90dG9tID0gY29uZmlnLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGxlZnQgPSBsZWZ0ID4gY29uZmlnLnRhYmxlV2lkdGggPyBjb25maWcudGFibGVXaWR0aCA6IGxlZnQ7XG5cdGxlZnQgPSBsZWZ0IDwgY29uZmlnLmlubmVyLm1pbkJ1ZmZlcldpZHRoID8gY29uZmlnLmlubmVyLm1pbkJ1ZmZlcldpZHRoIDogbGVmdDtcblx0cmlnaHQgPSBjb25maWcudGFibGVXaWR0aCAtIGxlZnQ7XG5cdHRvcCA9IHRvcCArIGNvbmZpZy5pbm5lci5taW5CdWZmZXJIZWlnaHQgPiBjb25maWcudGFibGVIZWlnaHQgPyBjb25maWcudGFibGVIZWlnaHQgKyBjb25maWcuaW5uZXIubWluQnVmZmVySGVpZ2h0IDogdG9wICsgY29uZmlnLmlubmVyLm1pbkJ1ZmZlckhlaWdodDtcblx0Ym90dG9tID0gY29uZmlnLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGNvbmZpZy5pbm5lci5sZWZ0Q2VsbE9mZnNldCA9IE1hdGguZmxvb3IobGVmdCAvIGNvbmZpZy5kaW1lbnNpb25zLmNlbGxXaWR0aCk7XG5cdGNvbmZpZy5pbm5lci50b3BDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcigodG9wIC0gdG9wICUgY29uZmlnLmRpbWVuc2lvbnMuY2VsbEhlaWdodCkgLyBjb25maWcuZGltZW5zaW9ucy5jZWxsSGVpZ2h0KTtcblxuXHRjb25maWcuaW5uZXIuYnVmZmVyTGVmdC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSBsZWZ0ICsgJ3B4Jztcblx0fSk7XG5cdGNvbmZpZy5pbm5lci5idWZmZXJSaWdodC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUubWluV2lkdGggPSByaWdodCArICdweCc7XG5cdH0pO1xuXHRjb25maWcuaW5uZXIuYnVmZmVyVG9wLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5oZWlnaHQgPSB0b3AgKyAncHgnO1xuXHR9KTtcblx0Y29uZmlnLmlubmVyLmJ1ZmZlckJvdHRvbS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0ZWwuc3R5bGUuaGVpZ2h0ID0gYm90dG9tICsgJ3B4Jztcblx0fSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0VGFibGU6IGluaXRUYWJsZSxcblx0aW5pdENvbnRhaW5lcnM6IGluaXRDb250YWluZXJzLFxuXHRpbml0QnVmZmVyczogaW5pdEJ1ZmZlcnNcbn07XG59LHtcIi4vZG9tXCI6MTB9XSwxNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBkb21VdGlsID0gcmVxdWlyZSgnLi9kb20nKTtcblxuZnVuY3Rpb24gZGVmYXVsdENvbXBhcmUoYSwgYiwgYXR0cmlidXRlLCBpc0Rvd24pIHtcblx0dmFyIGF0dHJBID0gYVthdHRyaWJ1dGVdLFxuXHRcdGF0dHJCID0gYlthdHRyaWJ1dGVdO1xuXG5cdGlmICh0eXBlb2YgYXR0ckEgPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGF0dHJCICE9ICd1bmRlZmluZWQnIHx8IGF0dHJBIDwgYXR0ckIpIHtcblx0XHRyZXR1cm4gaXNEb3duID8gLTEgOiAxO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBhdHRyQSAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgYXR0ckIgPT0gJ3VuZGVmaW5lZCcgfHwgYXR0ckEgPiBhdHRyQikge1xuXHRcdHJldHVybiBpc0Rvd24gPyAxIDogLTE7XG5cdH1cblxuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc29ydEJ5Q29sdW1uKGNvbmZpZywgY29sdW1uKSB7XG5cdHZhciBkaXJlY3Rpb24gPSBjb2x1bW4uZ2V0QXR0cmlidXRlKCdkYXRhLWRpcmVjdGlvbicpLFxuXHRcdGF0dHJpYnV0ZSA9IGNvbHVtbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtYXR0cmlidXRlJyk7XG5cblx0aWYgKGRpcmVjdGlvbiA9PT0gJ25vbmUnIHx8IGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB7XG5cdFx0ZGlyZWN0aW9uID0gJ3VwJztcblx0fSBlbHNlIHtcblx0XHRkaXJlY3Rpb24gPSAnZG93bic7XG5cdH1cblxuXHRjb25maWcuaW5uZXIuc29ydC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cdGNvbmZpZy5pbm5lci5zb3J0LmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcblx0Y29uZmlnLmRhdGFTb3VyY2Uuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBkZWZhdWx0Q29tcGFyZShhLCBiLCBhdHRyaWJ1dGUsIGRpcmVjdGlvbiA9PT0gJ2Rvd24nKTsgfSk7XG5cblx0ZG9tVXRpbC51cGRhdGVUYWJsZShjb25maWcpO1xufVxuXG5mdW5jdGlvbiByZXNldFNvcnQoY29uZmlnKSB7XG5cdGlmICh0eXBlb2YgY29uZmlnLnNvcnQuZGVmYXVsdCA9PSAndW5kZWZpbmVkJykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbmZpZy5pbm5lci5zb3J0LmRpcmVjdGlvbiA9ICdhc2MnO1xuXHRjb25maWcuaW5uZXIuc29ydC5hdHRyaWJ1dGUgPSBjb25maWcuc29ydC5kZWZhdWx0O1xuXHRjb25maWcuZGF0YVNvdXJjZS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGRlZmF1bHRDb21wYXJlKGEsIGIsIGNvbmZpZy5zb3J0LmRlZmF1bHQsIHRydWUpOyB9KTtcblxuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKGNvbmZpZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzb3J0QnlDb2x1bW46IHNvcnRCeUNvbHVtbixcblx0cmVzZXRTb3J0OiByZXNldFNvcnRcbn07XG59LHtcIi4vZG9tXCI6MTB9XSwxNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBDZWxsID0gcmVxdWlyZSgnLi4vbW9kZWxzL2NlbGwnKTtcblxuZnVuY3Rpb24gZ2V0Q2VsbChjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyKSB7XG5cdHZhciBjZWxsT2JqID0gY29uZmlnLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IHJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNvbHVtbk51bWJlcjtcblx0XHR9KSxcblx0XHRyb3dPYmogPSBjb25maWcuaGVhZGVyc1tjb25maWcuaW5uZXIuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGlmICh0eXBlb2YgY2VsbE9iaiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNlbGxPYmogPSBuZXcgQ2VsbCh7XG5cdFx0XHRrZXk6IHJvd09ialtjb2x1bW5OdW1iZXJdLmtleSxcblx0XHRcdHZhbHVlOiBjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV1cblx0XHR9KTtcblxuXHRcdGNlbGxPYmoudXBkYXRlQXR0cmlidXRlcyh7XG5cdFx0XHRyb3dOdW1iZXI6IHJvd051bWJlcixcblx0XHRcdGNvbHVtbk51bWJlcjogY29sdW1uTnVtYmVyXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gY2VsbE9iajtcbn1cblxuZnVuY3Rpb24gZ2V0Rml4ZWRDZWxsKGNvbmZpZywgcm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpIHtcblx0dmFyIGNlbGxPYmogPSBudWxsLFxuXHRcdHJvd09iaiA9IGNvbmZpZy5maXhlZEhlYWRlcnNbY29uZmlnLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjZWxsT2JqID0gbmV3IENlbGwoe1xuXHRcdGtleTogcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5LFxuXHRcdHZhbHVlOiBjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV1cblx0fSk7XG5cblx0cmV0dXJuIGNlbGxPYmo7XG59XG5cbmZ1bmN0aW9uIHNldENlbGxWYWx1ZShjb25maWcsIHJvd051bWJlciwgY29sdW1uTnVtYmVyLCB2YWx1ZSkge1xuXHR2YXIgcm93T2JqID0gY29uZmlnLmhlYWRlcnNbY29uZmlnLmlubmVyLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRjb25maWcuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNDZWxsQ2hhbmdlZChjb25maWcsIGNlbGxPYmopIHtcblx0dmFyIG9yaWdpbmFsT2JqID0gZ2V0Q2VsbChjb25maWcsIGNlbGxPYmoucm93TnVtYmVyLCBjZWxsT2JqLmNvbHVtbk51bWJlciksXG5cdFx0ZWRpdGVkT2JqID0gY29uZmlnLmlubmVyLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdFx0fSksXG5cdFx0b3JpZ2luYWxWYWwgPSBvcmlnaW5hbE9iai52YWx1ZSB8fCAnJztcblxuXHRyZXR1cm4gb3JpZ2luYWxWYWwgIT09IGNlbGxPYmoudmFsdWUgfHwgdHlwZW9mIGVkaXRlZE9iaiAhPSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gc2V0VXBkYXRlZENlbGxWYWx1ZShjb25maWcsIGNlbGxPYmopIHtcblx0dmFyIHByZXYgPSBjb25maWcuaW5uZXIuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdHJldHVybiBlbC5yb3dOdW1iZXIgPT09IGNlbGxPYmoucm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY2VsbE9iai5jb2x1bW5OdW1iZXI7XG5cdH0pO1xuXG5cdGlmICh0eXBlb2YgcHJldiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbmZpZy5pbm5lci5lZGl0ZWRDZWxscy5wdXNoKGNlbGxPYmopO1xuXHR9IGVsc2Uge1xuXHRcdHByZXYudmFsdWUgPSBjZWxsT2JqLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRDZWxsOiBnZXRDZWxsLFxuXHRnZXRGaXhlZENlbGw6IGdldEZpeGVkQ2VsbCxcblx0c2V0Q2VsbFZhbHVlOiBzZXRDZWxsVmFsdWUsXG5cdGlzQ2VsbENoYW5nZWQ6IGlzQ2VsbENoYW5nZWQsXG5cdHNldFVwZGF0ZWRDZWxsVmFsdWU6IHNldFVwZGF0ZWRDZWxsVmFsdWVcbn07XG59LHtcIi4uL21vZGVscy9jZWxsXCI6Mn1dfSx7fSxbMV0pO1xuIl0sImZpbGUiOiJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJ9
