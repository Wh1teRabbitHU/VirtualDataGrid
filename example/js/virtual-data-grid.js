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
	containerSelector: '.data-container',
	fixedContainerClass: 'fixed-container',
	fixedTableClass: 'fixed-table',
	virtualContainerClass: 'virtual-container',
	virtualTableClass: 'virtual-table',
	editingCellClass: 'editing-cell',
	editedCellClass: 'edited-cell',
	cellWidth: 150,
	cellHeight: 50,
	containerHeight: configUtil.getDefaultContainerHeight,
	dataSource: [ {} ],
	headers: [ [ {} ] ],
	fixedHeaders: [ [ {} ] ],
	indexOfCellKeyHeader: configUtil.getIndexOfCellKeyHeader,
	isDsSimple: true,
	colspanOffset: configUtil.getMaxColspan,
	visibleRowNumber: configUtil.getVisibleRowNumber,
	visibleColumnNumber: configUtil.getVisibleColumnNumber,
	editable: false,
	saveButtonSelector: null,
	onBeforeEdit: configUtil.nil,
	onValidation: configUtil.nil,
	onAfterEdit: configUtil.nil,
	onBeforeSave: configUtil.nil,
	onAfterSave: configUtil.nil
};

function init(options) {
	initInnerValues();

	updateValue('containerSelector', options.containerSelector);
	updateValue('fixedContainerClass', options.fixedContainerClass);
	updateValue('fixedTableClass', options.fixedTableClass);
	updateValue('virtualContainerClass', options.virtualContainerClass);
	updateValue('virtualTableClass', options.virtualTableClass);
	updateValue('editingCellClass', options.editingCellClass);
	updateValue('editedCellClass', options.editedCellClass);
	updateValue('cellWidth', options.cellWidth);
	updateValue('cellHeight', options.cellHeight);
	updateValue('containerHeight', configUtil.calculateVirtualContainerHeight(configInstance, options.containerHeight));

	generatorUtil.initContainers(configInstance);

	updateValue('dataSource', options.dataSource);
	updateValue('headers', options.headers);
	updateValue('fixedHeaders', options.fixedHeaders);
	updateValue('indexOfCellKeyHeader', options.indexOfCellKeyHeader);
	updateValue('isDsSimple', options.isDsSimple);
	updateValue('colspanOffset', options.colspanOffset);
	updateValue('visibleRowNumber', options.visibleRowNumber);
	updateValue('visibleColumnNumber', options.visibleColumnNumber);
	updateValue('editable', options.editable);
	updateValue('saveButtonSelector', options.saveButtonSelector);
	updateValue('visibleColumnNumber', options.visibleColumnNumber);
	updateValue('onBeforeEdit', options.onBeforeEdit);
	updateValue('onValidation', options.onValidation);
	updateValue('onAfterEdit', options.onAfterEdit);
	updateValue('onBeforeSave', options.onBeforeSave);
	updateValue('onAfterSave', options.onAfterSave);

	configInstance.tableWidth = (configInstance.headers[configInstance.indexOfCellKeyHeader].length - configInstance.visibleColumnNumber) * configInstance.cellWidth;
	configInstance.tableHeight = (configInstance.dataSource.length - configInstance.visibleRowNumber + 1) * configInstance.cellHeight;
	configInstance.leftCellOffset = 0;
	configInstance.topCellOffset = 0;
}

function initInnerValues() {
	configInstance.bufferRowTopClass = 'buffer-row-top';
	configInstance.bufferRowBottomClass = 'buffer-row-bottom';
	configInstance.bufferColumnLeftClass = 'buffer-column-left';
	configInstance.bufferColumnRightClass = 'buffer-column-right';
	configInstance.headerRowClass = 'header-row';
	configInstance.headerCellClass = 'header-cell';
	configInstance.dataRowClass = 'data-row';
	configInstance.dataCellClass = 'data-cell';

	// Minimum buffer cell height. Azért van rá szükség, mert ha nincs megadva, akkor ugrik egyett a scroll ha a végére vagy az elejére értünk a táblázatban
	configInstance.minCellHeight = 2;

	// Az offset miatt kell a számoláshoz
	configInstance.tableHeightOffset = configInstance.minCellHeight * 2;
	configInstance.editedCells = [];
}

function updateValue(key, value) {
	if (typeof value == 'undefined') {
		configInstance[key] = typeof DEFAULTS[key] == 'function' ? DEFAULTS[key](configInstance) : DEFAULTS[key];
	} else {
		configInstance[key] = value;
	}
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

	return instance.tableHeightOffset + Math.floor(height / instance.cellHeight) * instance.cellHeight;
}

function getDefaultContainerHeight(instance) {
	return calculateVirtualContainerHeight(instance, window.innerHeight - document.querySelector(instance.containerSelector).getBoundingClientRect().top - 64);
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
	return Math.floor((instance.containerHeight - instance.tableHeightOffset) / instance.cellHeight) - instance.headers.length;
}

function getVisibleColumnNumber(instance) {
	return Math.floor(document.querySelector('.' + instance.virtualContainerClass).offsetWidth / instance.cellWidth +
		(instance.colspanOffset > 2 ? instance.colspanOffset : 2) + instance.colspanOffset);
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
	cell.className = configInstance.dataCellClass + ' ' + (cellObj.class || '');
}

function updateTable() {
	var countRow = 0,
		colspan = 1;

	document.querySelectorAll('.' + configInstance.virtualTableClass + ' tr.' + configInstance.headerRowClass).forEach(function(row) {
		row.querySelectorAll('td.' + configInstance.headerCellClass).forEach(function(cell, cellNumber) {
			var cellObj = configInstance.headers[countRow][configInstance.leftCellOffset + cellNumber];

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
				var calculatedColspan = configInstance.visibleColumnNumber <= cellNumber + cellObj.colspan ? configInstance.visibleColumnNumber - cellNumber : cellObj.colspan;

				cell.setAttribute('colspan', calculatedColspan);
				colspan = calculatedColspan;
			}
		});
		countRow++;
		colspan = 1;
	});

	document.querySelectorAll('.' + configInstance.virtualTableClass + ' tr.' + configInstance.dataRowClass).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.dataCellClass).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getCell(configInstance.topCellOffset + rowNumber, configInstance.leftCellOffset + cellNumber));
		});
	});

	document.querySelectorAll('.' + configInstance.fixedTableClass + ' tr.' + configInstance.dataRowClass).forEach(function(row, rowNumber) {
		row.querySelectorAll('td.' + configInstance.dataCellClass).forEach(function(cell, cellNumber) {
			updateCell(cell, tableUtil.getFixedCell(configInstance.topCellOffset + rowNumber, cellNumber));
		});
	});
}

function resetEditingCell(onInputBlurEventHandler) {
	document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.editingCellClass).forEach(function(editingCell) {
		var input = editingCell.querySelector('input');

		input.removeEventListener('blur', onInputBlurEventHandler);
		editingCell.innerHTML = input.value;
		editingCell.classList.remove(configInstance.editingCellClass);
	});
}

function resetEditedCell() {
	document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.editingCellClass).forEach(function(editedCell) {
		editedCell.classList.remove(configInstance.editedCellClass);
	});

	configInstance.editedCells = [];
	updateTable();
}

function destroyTable() {
	document.querySelector(configInstance.containerSelector).innerHTML = '';
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
	if (!configInstance.editable) {
		return;
	}

	var args = new EventArguments({
		cellObject: configInstance.editedCells,
		cancelEvent: false
	});

	configInstance.onBeforeSave(args);

	if (!args.cancelEvent) {
		configInstance.editedCells.forEach(function(cell) {
			tableUtil.setCellValue(cell.rowNumber, cell.columnNumber, cell.value);
		});
		domUtil.resetEditedCell();

		configInstance.onAfterSave(args);
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
		rowNumber = domUtil.indexOfElement(cell.parentNode) + configInstance.topCellOffset,
		columnNumber = domUtil.indexOfElement(cell) - 1 + configInstance.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber);

	editedObj.updateAttributes({
		value: this.value,
		class: configInstance.editedCellClass
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

	configInstance.onValidation(args);

	if (args.cancelEdit !== true) {
		tableUtil.setUpdatedCellValue(args.cellObject);
		domUtil.updateCell(args.cell, args.cellObject);

		configInstance.onAfterEdit(args);
	}
}

function onClickCellEventHandler() {
	if (!configInstance.editable) {
		return;
	}

	var rowNumber = domUtil.indexOfElement(this.parentNode) + configInstance.topCellOffset,
		columnNumber = domUtil.indexOfElement(this) - 1 + configInstance.leftCellOffset,
		editedObj = tableUtil.getCell(rowNumber, columnNumber),
		input = document.createElement('input');

	input.setAttribute('type', 'text');

	var args = new EventArguments({
		cell: this,
		cellObject: editedObj,
		cancelEvent: false
	});

	configInstance.onBeforeEdit(args);

	if (!args.cancelEvent) {
		this.classList.add(configInstance.editingCellClass);
		this.classList.remove(configInstance.editedCellClass);
		this.innerHTML = '';
		this.appendChild(input);

		input.focus();
		input.value = editedObj.value;
		input.addEventListener('blur', onInputBlurEventHandler);
	}
}

function addEvents() {
	container = document.querySelector('.' + configInstance.virtualContainerClass);

	if (container !== null) {
		container.addEventListener('wheel', onWheelEventHandler, { passive: false, capture: true });
		container.addEventListener('scroll', onScrollEventHandler);
	}

	if (configInstance.editable && configInstance.saveButtonSelector !== null) {
		document.querySelector(configInstance.saveButtonSelector).addEventListener('click', editUtil.saveCells);
	}

	if (configInstance.editable) {
		document.querySelectorAll('.' + configInstance.virtualTableClass + ' td.' + configInstance.dataCellClass).forEach(function(el) {
			el.addEventListener('click', onClickCellEventHandler);
		});
	}
}

function removeEvents() {
	document.querySelector('.' + configInstance.virtualContainerClass).removeEventListener('scroll', onScrollEventHandler);
}

module.exports = {
	onClickCellEventHandler: onClickCellEventHandler,
	addEvents: addEvents,
	removeEvents: removeEvents
};
},{"../instances/configuration":1,"../models/event-arguments":3,"../utils/dom":9,"../utils/edit":10,"../utils/generator":12,"../utils/table":13}],12:[function(require,module,exports){
'use strict';

function initContainers(instance) {
	var container = document.querySelector(instance.containerSelector),
		virtualContainer = document.createElement('div'),
		virtualTable = document.createElement('table'),
		fixedContainer = document.createElement('div'),
		fixedTable = document.createElement('table');

	virtualContainer.classList.add(instance.virtualContainerClass);
	virtualTable.classList.add(instance.virtualTableClass);
	fixedContainer.classList.add(instance.fixedContainerClass);
	fixedTable.classList.add(instance.fixedTableClass);

	container.appendChild(fixedContainer);
	fixedContainer.appendChild(fixedTable);

	container.appendChild(virtualContainer);
	virtualContainer.appendChild(virtualTable);

	virtualContainer.style.maxHeight = instance.containerHeight + 'px';
	virtualContainer.style.overflow = 'scroll';

	fixedContainer.style.padding = instance.minCellHeight + 'px 0';
	fixedContainer.style.float = 'left';
}

function initTable(instance) {
	// Generate virtual table
	var virtualThead = document.createElement('thead'),
		virtualTbody = document.createElement('tbody'),
		trHeadBuffer = document.createElement('tr');

	trHeadBuffer.classList.add(instance.bufferRowTopClass);

	var i, j, trHead, trBody, bufferColumnLeft, bufferColumnRight, bufferRowBottom, tdElement;

	// Generate virtual header
	bufferColumnLeft = document.createElement('td');
	bufferColumnLeft.classList.add(instance.bufferColumnLeftClass);

	trHeadBuffer.appendChild(bufferColumnLeft);

	for (i = 0; i < instance.visibleColumnNumber; i++) {
		tdElement = document.createElement('td');
		tdElement.style.minWidth = instance.cellWidth + 'px';
		trHeadBuffer.appendChild(tdElement);
	}

	bufferColumnRight = document.createElement('td');
	bufferColumnRight.classList.add(instance.bufferColumnRightClass);

	trHeadBuffer.appendChild(bufferColumnRight);

	virtualThead.appendChild(trHeadBuffer);

	instance.headers.forEach(function(headerRow) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.headerRowClass);
		trHead.style.height = instance.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnLeftClass);

		trHead.appendChild(tdElement);

		for (j = 0; j < instance.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.headerCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';
			tdElement.innerHTML = headerRow[j].text || headerRow[j].key || '';

			trHead.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnRightClass);

		trHead.appendChild(tdElement);

		virtualThead.appendChild(trHead);
	});

	// Generate virtual body
	for (i = 0; i < instance.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.dataRowClass);
		trBody.style.height = instance.cellHeight + 'px';

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnLeftClass);

		trBody.appendChild(tdElement);

		for (j = 0; j < instance.visibleColumnNumber; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.dataCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		tdElement = document.createElement('td');
		tdElement.classList.add(instance.bufferColumnRightClass);

		trBody.appendChild(tdElement);

		virtualTbody.appendChild(trBody);
	}

	bufferRowBottom = document.createElement('tr');
	bufferRowBottom.classList.add(instance.bufferRowBottomClass);

	virtualTbody.appendChild(bufferRowBottom);

	document.querySelector('.' + instance.virtualTableClass).appendChild(virtualThead);
	document.querySelector('.' + instance.virtualTableClass).appendChild(virtualTbody);

	instance.bufferLeft = document.querySelectorAll('.' + instance.bufferColumnLeftClass);
	instance.bufferRight = document.querySelectorAll('.' + instance.bufferColumnRightClass);
	instance.bufferTop = document.querySelectorAll('.' + instance.bufferRowTopClass);
	instance.bufferBottom = document.querySelectorAll('.' + instance.bufferRowBottomClass);

	// Generate fixed table

	if (instance.fixedHeaders.length === 0) {
		return;
	}

	var fixedThead = document.createElement('thead'),
		fixedTbody = document.createElement('tbody');

	// Generate fixed header

	for (i = 0; i < instance.fixedHeaders.length; i++) {
		trHead = document.createElement('tr');
		trHead.classList.add(instance.headerRowClass);
		trHead.style.height = instance.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[i].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.headerCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';
			tdElement.innerHTML = instance.fixedHeaders[i][j].text || instance.fixedHeaders[i][j].key || '';

			trHead.appendChild(tdElement);
		}

		fixedThead.appendChild(trHead);
	}

	// Generate fixed body

	for (i = 0; i < instance.visibleRowNumber; i++) {
		trBody = document.createElement('tr');
		trBody.classList.add(instance.dataRowClass);
		trBody.style.height = instance.cellHeight + 'px';

		for (j = 0; j < instance.fixedHeaders[instance.indexOfCellKeyHeader].length; j++) {
			tdElement = document.createElement('td');
			tdElement.classList.add(instance.dataCellClass);
			tdElement.style.minWidth = instance.cellWidth + 'px';

			trBody.appendChild(tdElement);
		}

		fixedTbody.appendChild(trBody);
	}

	document.querySelector('.' + instance.fixedTableClass).appendChild(fixedThead);
	document.querySelector('.' + instance.fixedTableClass).appendChild(fixedTbody);
}

function initBuffers(instance) {
	var left = document.querySelector('.' + instance.virtualContainerClass).scrollLeft - document.querySelector('.' + instance.virtualContainerClass).scrollLeft % instance.cellWidth - instance.colspanOffset * instance.cellWidth,
		right = instance.tableWidth - left,
		top = document.querySelector('.' + instance.virtualContainerClass).scrollTop,
		bottom = instance.tableHeight - top;

	left = left > instance.tableWidth ? instance.tableWidth : left;
	left = left < 0 ? 0 : left;
	right = instance.tableWidth - left;
	top = top + instance.minCellHeight > instance.tableHeight ? instance.tableHeight + instance.minCellHeight : top + instance.minCellHeight;
	bottom = instance.tableHeight - top;

	instance.leftCellOffset = Math.floor(left / instance.cellWidth);
	instance.topCellOffset = Math.floor((top - top % instance.cellHeight) / instance.cellHeight);

	instance.bufferLeft.forEach(function(el) {
		el.style.minWidth = left + 'px';
	});
	instance.bufferRight.forEach(function(el) {
		el.style.minWidth = right + 'px';
	});
	instance.bufferTop.forEach(function(el) {
		el.style.height = top + 'px';
	});
	instance.bufferBottom.forEach(function(el) {
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
	var cellObj = configInstance.editedCells.find(function(el) {
			return el.rowNumber === rowNumber && el.columnNumber === columnNumber;
		}),
		rowObj = configInstance.headers[configInstance.indexOfCellKeyHeader];

	if (typeof cellObj == 'undefined') {
		if (configInstance.isDsSimple) {
			cellObj = new Cell({
				key: rowObj[columnNumber].key,
				value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
			});
		} else {
			cellObj = new Cell(configInstance.dataSource[rowNumber].find(function(el) {
				return el.key === rowObj[columnNumber].key;
			}));
		}

		cellObj.updateAttributes({
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});
	}

	return cellObj;
}

function getFixedCell(rowNumber, columnNumber) {
	var cellObj = null,
		rowObj = configInstance.fixedHeaders[configInstance.indexOfCellKeyHeader];

	if (configInstance.isDsSimple) {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
		});
	} else {
		cellObj = new Cell(configInstance.dataSource[rowNumber].find(function(el) {
			return el.key === rowObj[columnNumber].key;
		}));
	}

	return cellObj;
}

function setCellValue(rowNumber, columnNumber, value) {
	var rowObj = configInstance.headers[configInstance.indexOfCellKeyHeader];

	if (configInstance.options.isDsSimple) {
		configInstance.dataSource[rowNumber][rowObj[columnNumber].key] = value;
	} else {
		configInstance.dataSource[rowNumber].find(function(el) {
			return el.key === rowObj[columnNumber].key;
		}).value = value;
	}
}

function isCellChanged(cellObj) {
	var originalObj = getCell(cellObj.rowNumber, cellObj.columnNumber),
		editedObj = configInstance.editedCells.find(function(el) {
			return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
		}),
		originalVal = originalObj.value || '';

	return originalVal !== cellObj.value || typeof editedObj != 'undefined';
}

function setUpdatedCellValue(cellObj) {
	var prev = configInstance.editedCells.find(function(el) {
		return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
	});

	if (typeof prev == 'undefined') {
		configInstance.editedCells.push(cellObj);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXJ0dWFsLWRhdGEtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25maWd1cmF0aW9uID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZmlndXJhdGlvbjtcbn0se31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsT2JqZWN0KHApIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGluaXRBdHRyKCdrZXknKTtcblx0aW5pdEF0dHIoJ3ZhbHVlJyk7XG5cdGluaXRBdHRyKCdjbGFzcycpO1xuXHRpbml0QXR0cigncm93TnVtYmVyJyk7XG5cdGluaXRBdHRyKCdjb2x1bW5OdW1iZXInKTtcblxuXHRmdW5jdGlvbiBpbml0QXR0cihuYW1lKSB7XG5cdFx0c2VsZltuYW1lXSA9IHR5cGVvZiBwID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBwW25hbWVdID09ICd1bmRlZmluZWQnID8gbnVsbCA6IHBbbmFtZV07XG5cdH1cblxuXHR0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhdHRycykge1xuXHRcdE9iamVjdC5rZXlzKGF0dHJzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcblx0XHRcdGlmICh0eXBlb2YgYXR0cnNba10gIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGZba10gIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0c2VsZltrXSA9IGF0dHJzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxPYmplY3Q7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRBcmd1bWVudHMocCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aW5pdEF0dHIoJ2NlbGwnKTtcblx0aW5pdEF0dHIoJ2NlbGxPYmplY3QnKTtcblx0aW5pdEF0dHIoJ2NhbmNlbEV2ZW50Jyk7XG5cblx0ZnVuY3Rpb24gaW5pdEF0dHIobmFtZSkge1xuXHRcdHNlbGZbbmFtZV0gPSB0eXBlb2YgcCA9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcFtuYW1lXSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBwW25hbWVdO1xuXHR9XG5cblx0dGhpcy51cGRhdGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcblx0XHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG5cdFx0XHRpZiAodHlwZW9mIGF0dHJzW2tdICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmW2tdICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHNlbGZba10gPSBhdHRyc1trXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEFyZ3VtZW50cztcbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG52YXIgY29uZmlnVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbmZpZ3VyYXRpb24nKSxcblx0Z2VuZXJhdG9yVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpO1xuXG52YXIgREVGQVVMVFMgPSB7XG5cdGNvbnRhaW5lclNlbGVjdG9yOiAnLmRhdGEtY29udGFpbmVyJyxcblx0Zml4ZWRDb250YWluZXJDbGFzczogJ2ZpeGVkLWNvbnRhaW5lcicsXG5cdGZpeGVkVGFibGVDbGFzczogJ2ZpeGVkLXRhYmxlJyxcblx0dmlydHVhbENvbnRhaW5lckNsYXNzOiAndmlydHVhbC1jb250YWluZXInLFxuXHR2aXJ0dWFsVGFibGVDbGFzczogJ3ZpcnR1YWwtdGFibGUnLFxuXHRlZGl0aW5nQ2VsbENsYXNzOiAnZWRpdGluZy1jZWxsJyxcblx0ZWRpdGVkQ2VsbENsYXNzOiAnZWRpdGVkLWNlbGwnLFxuXHRjZWxsV2lkdGg6IDE1MCxcblx0Y2VsbEhlaWdodDogNTAsXG5cdGNvbnRhaW5lckhlaWdodDogY29uZmlnVXRpbC5nZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHRkYXRhU291cmNlOiBbIHt9IF0sXG5cdGhlYWRlcnM6IFsgWyB7fSBdIF0sXG5cdGZpeGVkSGVhZGVyczogWyBbIHt9IF0gXSxcblx0aW5kZXhPZkNlbGxLZXlIZWFkZXI6IGNvbmZpZ1V0aWwuZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIsXG5cdGlzRHNTaW1wbGU6IHRydWUsXG5cdGNvbHNwYW5PZmZzZXQ6IGNvbmZpZ1V0aWwuZ2V0TWF4Q29sc3Bhbixcblx0dmlzaWJsZVJvd051bWJlcjogY29uZmlnVXRpbC5nZXRWaXNpYmxlUm93TnVtYmVyLFxuXHR2aXNpYmxlQ29sdW1uTnVtYmVyOiBjb25maWdVdGlsLmdldFZpc2libGVDb2x1bW5OdW1iZXIsXG5cdGVkaXRhYmxlOiBmYWxzZSxcblx0c2F2ZUJ1dHRvblNlbGVjdG9yOiBudWxsLFxuXHRvbkJlZm9yZUVkaXQ6IGNvbmZpZ1V0aWwubmlsLFxuXHRvblZhbGlkYXRpb246IGNvbmZpZ1V0aWwubmlsLFxuXHRvbkFmdGVyRWRpdDogY29uZmlnVXRpbC5uaWwsXG5cdG9uQmVmb3JlU2F2ZTogY29uZmlnVXRpbC5uaWwsXG5cdG9uQWZ0ZXJTYXZlOiBjb25maWdVdGlsLm5pbFxufTtcblxuZnVuY3Rpb24gaW5pdChvcHRpb25zKSB7XG5cdGluaXRJbm5lclZhbHVlcygpO1xuXG5cdHVwZGF0ZVZhbHVlKCdjb250YWluZXJTZWxlY3RvcicsIG9wdGlvbnMuY29udGFpbmVyU2VsZWN0b3IpO1xuXHR1cGRhdGVWYWx1ZSgnZml4ZWRDb250YWluZXJDbGFzcycsIG9wdGlvbnMuZml4ZWRDb250YWluZXJDbGFzcyk7XG5cdHVwZGF0ZVZhbHVlKCdmaXhlZFRhYmxlQ2xhc3MnLCBvcHRpb25zLmZpeGVkVGFibGVDbGFzcyk7XG5cdHVwZGF0ZVZhbHVlKCd2aXJ0dWFsQ29udGFpbmVyQ2xhc3MnLCBvcHRpb25zLnZpcnR1YWxDb250YWluZXJDbGFzcyk7XG5cdHVwZGF0ZVZhbHVlKCd2aXJ0dWFsVGFibGVDbGFzcycsIG9wdGlvbnMudmlydHVhbFRhYmxlQ2xhc3MpO1xuXHR1cGRhdGVWYWx1ZSgnZWRpdGluZ0NlbGxDbGFzcycsIG9wdGlvbnMuZWRpdGluZ0NlbGxDbGFzcyk7XG5cdHVwZGF0ZVZhbHVlKCdlZGl0ZWRDZWxsQ2xhc3MnLCBvcHRpb25zLmVkaXRlZENlbGxDbGFzcyk7XG5cdHVwZGF0ZVZhbHVlKCdjZWxsV2lkdGgnLCBvcHRpb25zLmNlbGxXaWR0aCk7XG5cdHVwZGF0ZVZhbHVlKCdjZWxsSGVpZ2h0Jywgb3B0aW9ucy5jZWxsSGVpZ2h0KTtcblx0dXBkYXRlVmFsdWUoJ2NvbnRhaW5lckhlaWdodCcsIGNvbmZpZ1V0aWwuY2FsY3VsYXRlVmlydHVhbENvbnRhaW5lckhlaWdodChjb25maWdJbnN0YW5jZSwgb3B0aW9ucy5jb250YWluZXJIZWlnaHQpKTtcblxuXHRnZW5lcmF0b3JVdGlsLmluaXRDb250YWluZXJzKGNvbmZpZ0luc3RhbmNlKTtcblxuXHR1cGRhdGVWYWx1ZSgnZGF0YVNvdXJjZScsIG9wdGlvbnMuZGF0YVNvdXJjZSk7XG5cdHVwZGF0ZVZhbHVlKCdoZWFkZXJzJywgb3B0aW9ucy5oZWFkZXJzKTtcblx0dXBkYXRlVmFsdWUoJ2ZpeGVkSGVhZGVycycsIG9wdGlvbnMuZml4ZWRIZWFkZXJzKTtcblx0dXBkYXRlVmFsdWUoJ2luZGV4T2ZDZWxsS2V5SGVhZGVyJywgb3B0aW9ucy5pbmRleE9mQ2VsbEtleUhlYWRlcik7XG5cdHVwZGF0ZVZhbHVlKCdpc0RzU2ltcGxlJywgb3B0aW9ucy5pc0RzU2ltcGxlKTtcblx0dXBkYXRlVmFsdWUoJ2NvbHNwYW5PZmZzZXQnLCBvcHRpb25zLmNvbHNwYW5PZmZzZXQpO1xuXHR1cGRhdGVWYWx1ZSgndmlzaWJsZVJvd051bWJlcicsIG9wdGlvbnMudmlzaWJsZVJvd051bWJlcik7XG5cdHVwZGF0ZVZhbHVlKCd2aXNpYmxlQ29sdW1uTnVtYmVyJywgb3B0aW9ucy52aXNpYmxlQ29sdW1uTnVtYmVyKTtcblx0dXBkYXRlVmFsdWUoJ2VkaXRhYmxlJywgb3B0aW9ucy5lZGl0YWJsZSk7XG5cdHVwZGF0ZVZhbHVlKCdzYXZlQnV0dG9uU2VsZWN0b3InLCBvcHRpb25zLnNhdmVCdXR0b25TZWxlY3Rvcik7XG5cdHVwZGF0ZVZhbHVlKCd2aXNpYmxlQ29sdW1uTnVtYmVyJywgb3B0aW9ucy52aXNpYmxlQ29sdW1uTnVtYmVyKTtcblx0dXBkYXRlVmFsdWUoJ29uQmVmb3JlRWRpdCcsIG9wdGlvbnMub25CZWZvcmVFZGl0KTtcblx0dXBkYXRlVmFsdWUoJ29uVmFsaWRhdGlvbicsIG9wdGlvbnMub25WYWxpZGF0aW9uKTtcblx0dXBkYXRlVmFsdWUoJ29uQWZ0ZXJFZGl0Jywgb3B0aW9ucy5vbkFmdGVyRWRpdCk7XG5cdHVwZGF0ZVZhbHVlKCdvbkJlZm9yZVNhdmUnLCBvcHRpb25zLm9uQmVmb3JlU2F2ZSk7XG5cdHVwZGF0ZVZhbHVlKCdvbkFmdGVyU2F2ZScsIG9wdGlvbnMub25BZnRlclNhdmUpO1xuXG5cdGNvbmZpZ0luc3RhbmNlLnRhYmxlV2lkdGggPSAoY29uZmlnSW5zdGFuY2UuaGVhZGVyc1tjb25maWdJbnN0YW5jZS5pbmRleE9mQ2VsbEtleUhlYWRlcl0ubGVuZ3RoIC0gY29uZmlnSW5zdGFuY2UudmlzaWJsZUNvbHVtbk51bWJlcikgKiBjb25maWdJbnN0YW5jZS5jZWxsV2lkdGg7XG5cdGNvbmZpZ0luc3RhbmNlLnRhYmxlSGVpZ2h0ID0gKGNvbmZpZ0luc3RhbmNlLmRhdGFTb3VyY2UubGVuZ3RoIC0gY29uZmlnSW5zdGFuY2UudmlzaWJsZVJvd051bWJlciArIDEpICogY29uZmlnSW5zdGFuY2UuY2VsbEhlaWdodDtcblx0Y29uZmlnSW5zdGFuY2UubGVmdENlbGxPZmZzZXQgPSAwO1xuXHRjb25maWdJbnN0YW5jZS50b3BDZWxsT2Zmc2V0ID0gMDtcbn1cblxuZnVuY3Rpb24gaW5pdElubmVyVmFsdWVzKCkge1xuXHRjb25maWdJbnN0YW5jZS5idWZmZXJSb3dUb3BDbGFzcyA9ICdidWZmZXItcm93LXRvcCc7XG5cdGNvbmZpZ0luc3RhbmNlLmJ1ZmZlclJvd0JvdHRvbUNsYXNzID0gJ2J1ZmZlci1yb3ctYm90dG9tJztcblx0Y29uZmlnSW5zdGFuY2UuYnVmZmVyQ29sdW1uTGVmdENsYXNzID0gJ2J1ZmZlci1jb2x1bW4tbGVmdCc7XG5cdGNvbmZpZ0luc3RhbmNlLmJ1ZmZlckNvbHVtblJpZ2h0Q2xhc3MgPSAnYnVmZmVyLWNvbHVtbi1yaWdodCc7XG5cdGNvbmZpZ0luc3RhbmNlLmhlYWRlclJvd0NsYXNzID0gJ2hlYWRlci1yb3cnO1xuXHRjb25maWdJbnN0YW5jZS5oZWFkZXJDZWxsQ2xhc3MgPSAnaGVhZGVyLWNlbGwnO1xuXHRjb25maWdJbnN0YW5jZS5kYXRhUm93Q2xhc3MgPSAnZGF0YS1yb3cnO1xuXHRjb25maWdJbnN0YW5jZS5kYXRhQ2VsbENsYXNzID0gJ2RhdGEtY2VsbCc7XG5cblx0Ly8gTWluaW11bSBidWZmZXIgY2VsbCBoZWlnaHQuIEF6w6lydCB2YW4gcsOhIHN6w7xrc8OpZywgbWVydCBoYSBuaW5jcyBtZWdhZHZhLCBha2tvciB1Z3JpayBlZ3lldHQgYSBzY3JvbGwgaGEgYSB2w6lnw6lyZSB2YWd5IGF6IGVsZWrDqXJlIMOpcnTDvG5rIGEgdMOhYmzDoXphdGJhblxuXHRjb25maWdJbnN0YW5jZS5taW5DZWxsSGVpZ2h0ID0gMjtcblxuXHQvLyBBeiBvZmZzZXQgbWlhdHQga2VsbCBhIHN6w6Ftb2zDoXNob3pcblx0Y29uZmlnSW5zdGFuY2UudGFibGVIZWlnaHRPZmZzZXQgPSBjb25maWdJbnN0YW5jZS5taW5DZWxsSGVpZ2h0ICogMjtcblx0Y29uZmlnSW5zdGFuY2UuZWRpdGVkQ2VsbHMgPSBbXTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVmFsdWUoa2V5LCB2YWx1ZSkge1xuXHRpZiAodHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y29uZmlnSW5zdGFuY2Vba2V5XSA9IHR5cGVvZiBERUZBVUxUU1trZXldID09ICdmdW5jdGlvbicgPyBERUZBVUxUU1trZXldKGNvbmZpZ0luc3RhbmNlKSA6IERFRkFVTFRTW2tleV07XG5cdH0gZWxzZSB7XG5cdFx0Y29uZmlnSW5zdGFuY2Vba2V5XSA9IHZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBpbml0LFxuXHR1cGRhdGVWYWx1ZTogdXBkYXRlVmFsdWVcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL3V0aWxzL2NvbmZpZ3VyYXRpb25cIjo4LFwiLi4vdXRpbHMvZ2VuZXJhdG9yXCI6MTJ9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZ3VyYXRpb24gICAgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24nKSxcblx0ZXZlbnRIYW5kbGVyVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2V2ZW50LWhhbmRsZXInKSxcblx0Z2VuZXJhdG9yVXRpbCAgICA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpLFxuXHRkb21VdGlsICAgICAgICAgID0gcmVxdWlyZSgnLi4vdXRpbHMvZG9tJyk7XG5cbnZhciBjb25maWdJbnN0YW5jZSAgID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzL2NvbmZpZ3VyYXRpb24nKTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVUYWJsZShpZCwgb3B0aW9ucykge1xuXHRjb25maWd1cmF0aW9uLmluaXQob3B0aW9ucyk7XG5cblx0Z2VuZXJhdG9yVXRpbC5pbml0VGFibGUoY29uZmlnSW5zdGFuY2UpO1xuXHRnZW5lcmF0b3JVdGlsLmluaXRCdWZmZXJzKGNvbmZpZ0luc3RhbmNlKTtcblxuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKCk7XG5cblx0ZXZlbnRIYW5kbGVyVXRpbC5hZGRFdmVudHMoKTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveVRhYmxlKCkge1xuXHRldmVudEhhbmRsZXJVdGlsLnJlbW92ZUV2ZW50cygpO1xuXHRkb21VdGlsLmRlc3Ryb3lUYWJsZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2VuZXJhdGVUYWJsZTogZ2VuZXJhdGVUYWJsZSxcblx0ZGVzdHJveVRhYmxlOiBkZXN0cm95VGFibGVcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL3V0aWxzL2RvbVwiOjksXCIuLi91dGlscy9ldmVudC1oYW5kbGVyXCI6MTEsXCIuLi91dGlscy9nZW5lcmF0b3JcIjoxMixcIi4vY29uZmlndXJhdGlvblwiOjR9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuaWYgKHR5cGVvZiBBcnJheS5wcm90b3R5cGUuZmluZCA9PSAndW5kZWZpbmVkJykge1xuXHRBcnJheS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dGVuZC1uYXRpdmVcblx0XHRpZiAodGhpcyA9PT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLmZpbmQgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cblx0XHR2YXIgbGlzdCA9IE9iamVjdCh0aGlzKTtcblx0XHR2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG5cdFx0dmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG5cdFx0dmFyIHZhbHVlO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0dmFsdWUgPSBsaXN0W2ldO1xuXHRcdFx0aWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0KSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZmluZWRcblx0fTtcbn1cbn0se31dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIU5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoKSB7XG5cdE5vZGVMaXN0LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIGFyZ3VtZW50KSB7XG5cdFx0YXJndW1lbnQgPSBhcmd1bWVudCB8fCB3aW5kb3c7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoYXJndW1lbnQsIHRoaXNbaV0sIGksIHRoaXMpO1xuXHRcdH1cblx0fTtcbn1cbn0se31dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0KGluc3RhbmNlLCBoZWlnaHQpIHtcblx0aWYgKHR5cGVvZiBoZWlnaHQgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZXR1cm4gaGVpZ2h0O1xuXHR9XG5cblx0cmV0dXJuIGluc3RhbmNlLnRhYmxlSGVpZ2h0T2Zmc2V0ICsgTWF0aC5mbG9vcihoZWlnaHQgLyBpbnN0YW5jZS5jZWxsSGVpZ2h0KSAqIGluc3RhbmNlLmNlbGxIZWlnaHQ7XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRDb250YWluZXJIZWlnaHQoaW5zdGFuY2UpIHtcblx0cmV0dXJuIGNhbGN1bGF0ZVZpcnR1YWxDb250YWluZXJIZWlnaHQoaW5zdGFuY2UsIHdpbmRvdy5pbm5lckhlaWdodCAtIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaW5zdGFuY2UuY29udGFpbmVyU2VsZWN0b3IpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIDY0KTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIoaW5zdGFuY2UpIHtcblx0cmV0dXJuIGluc3RhbmNlLmhlYWRlcnMubGVuZ3RoIC0gMTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF4Q29sc3BhbihpbnN0YW5jZSkge1xuXHR2YXIgbWF4VmFsID0gMDtcblxuXHRpbnN0YW5jZS5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdGVsZW1lbnQuZm9yRWFjaChmdW5jdGlvbihzdWJFbGVtZW50KSB7XG5cdFx0XHRpZiAodHlwZW9mIHN1YkVsZW1lbnQuY29sc3BhbiAhPSAndW5kZWZpbmVkJyAmJiBtYXhWYWwgPCBzdWJFbGVtZW50LmNvbHNwYW4pIHtcblx0XHRcdFx0bWF4VmFsID0gc3ViRWxlbWVudC5jb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHRyZXR1cm4gbWF4VmFsO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlUm93TnVtYmVyKGluc3RhbmNlKSB7XG5cdHJldHVybiBNYXRoLmZsb29yKChpbnN0YW5jZS5jb250YWluZXJIZWlnaHQgLSBpbnN0YW5jZS50YWJsZUhlaWdodE9mZnNldCkgLyBpbnN0YW5jZS5jZWxsSGVpZ2h0KSAtIGluc3RhbmNlLmhlYWRlcnMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBnZXRWaXNpYmxlQ29sdW1uTnVtYmVyKGluc3RhbmNlKSB7XG5cdHJldHVybiBNYXRoLmZsb29yKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgaW5zdGFuY2UudmlydHVhbENvbnRhaW5lckNsYXNzKS5vZmZzZXRXaWR0aCAvIGluc3RhbmNlLmNlbGxXaWR0aCArXG5cdFx0KGluc3RhbmNlLmNvbHNwYW5PZmZzZXQgPiAyID8gaW5zdGFuY2UuY29sc3Bhbk9mZnNldCA6IDIpICsgaW5zdGFuY2UuY29sc3Bhbk9mZnNldCk7XG59XG5cbmZ1bmN0aW9uIG5pbCgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge307XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0OiBjYWxjdWxhdGVWaXJ0dWFsQ29udGFpbmVySGVpZ2h0LFxuXHRnZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0OiBnZXREZWZhdWx0Q29udGFpbmVySGVpZ2h0LFxuXHRnZXRJbmRleE9mQ2VsbEtleUhlYWRlcjogZ2V0SW5kZXhPZkNlbGxLZXlIZWFkZXIsXG5cdGdldE1heENvbHNwYW46IGdldE1heENvbHNwYW4sXG5cdGdldFZpc2libGVSb3dOdW1iZXI6IGdldFZpc2libGVSb3dOdW1iZXIsXG5cdGdldFZpc2libGVDb2x1bW5OdW1iZXI6IGdldFZpc2libGVDb2x1bW5OdW1iZXIsXG5cdG5pbDogbmlsXG59O1xufSx7fV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciB0YWJsZVV0aWwgPSByZXF1aXJlKCcuL3RhYmxlJyk7XG5cbnZhciBjb25maWdJbnN0YW5jZSA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uJyk7XG5cbmZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50KGVsZW1lbnQpIHtcblx0dmFyIGNvbGxlY3Rpb24gPSBlbGVtZW50LnBhcmVudE5vZGUuY2hpbGROb2RlcztcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoY29sbGVjdGlvbltpXSA9PT0gZWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDZWxsKGNlbGwsIGNlbGxPYmopIHtcblx0Y2VsbC5pbm5lckhUTUwgPSBjZWxsT2JqLnZhbHVlO1xuXHRjZWxsLmNsYXNzTmFtZSA9IGNvbmZpZ0luc3RhbmNlLmRhdGFDZWxsQ2xhc3MgKyAnICcgKyAoY2VsbE9iai5jbGFzcyB8fCAnJyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVRhYmxlKCkge1xuXHR2YXIgY291bnRSb3cgPSAwLFxuXHRcdGNvbHNwYW4gPSAxO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2UudmlydHVhbFRhYmxlQ2xhc3MgKyAnIHRyLicgKyBjb25maWdJbnN0YW5jZS5oZWFkZXJSb3dDbGFzcykuZm9yRWFjaChmdW5jdGlvbihyb3cpIHtcblx0XHRyb3cucXVlcnlTZWxlY3RvckFsbCgndGQuJyArIGNvbmZpZ0luc3RhbmNlLmhlYWRlckNlbGxDbGFzcykuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBjZWxsTnVtYmVyKSB7XG5cdFx0XHR2YXIgY2VsbE9iaiA9IGNvbmZpZ0luc3RhbmNlLmhlYWRlcnNbY291bnRSb3ddW2NvbmZpZ0luc3RhbmNlLmxlZnRDZWxsT2Zmc2V0ICsgY2VsbE51bWJlcl07XG5cblx0XHRcdGlmIChjb2xzcGFuID4gMSkge1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGNvbHNwYW4tLTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNlbGwuaW5uZXJIVE1MID0gY2VsbE9iai50ZXh0IHx8IGNlbGxPYmoua2V5IHx8ICcnO1xuXHRcdFx0XHRjZWxsLnN0eWxlLmRpc3BsYXkgPSAndGFibGUtY2VsbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgY2VsbE9iai5jb2xzcGFuID09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNlbGwucmVtb3ZlQXR0cmlidXRlKCdjb2xzcGFuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2FsY3VsYXRlZENvbHNwYW4gPSBjb25maWdJbnN0YW5jZS52aXNpYmxlQ29sdW1uTnVtYmVyIDw9IGNlbGxOdW1iZXIgKyBjZWxsT2JqLmNvbHNwYW4gPyBjb25maWdJbnN0YW5jZS52aXNpYmxlQ29sdW1uTnVtYmVyIC0gY2VsbE51bWJlciA6IGNlbGxPYmouY29sc3BhbjtcblxuXHRcdFx0XHRjZWxsLnNldEF0dHJpYnV0ZSgnY29sc3BhbicsIGNhbGN1bGF0ZWRDb2xzcGFuKTtcblx0XHRcdFx0Y29sc3BhbiA9IGNhbGN1bGF0ZWRDb2xzcGFuO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGNvdW50Um93Kys7XG5cdFx0Y29sc3BhbiA9IDE7XG5cdH0pO1xuXG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgY29uZmlnSW5zdGFuY2UudmlydHVhbFRhYmxlQ2xhc3MgKyAnIHRyLicgKyBjb25maWdJbnN0YW5jZS5kYXRhUm93Q2xhc3MpLmZvckVhY2goZnVuY3Rpb24ocm93LCByb3dOdW1iZXIpIHtcblx0XHRyb3cucXVlcnlTZWxlY3RvckFsbCgndGQuJyArIGNvbmZpZ0luc3RhbmNlLmRhdGFDZWxsQ2xhc3MpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Q2VsbChjb25maWdJbnN0YW5jZS50b3BDZWxsT2Zmc2V0ICsgcm93TnVtYmVyLCBjb25maWdJbnN0YW5jZS5sZWZ0Q2VsbE9mZnNldCArIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS5maXhlZFRhYmxlQ2xhc3MgKyAnIHRyLicgKyBjb25maWdJbnN0YW5jZS5kYXRhUm93Q2xhc3MpLmZvckVhY2goZnVuY3Rpb24ocm93LCByb3dOdW1iZXIpIHtcblx0XHRyb3cucXVlcnlTZWxlY3RvckFsbCgndGQuJyArIGNvbmZpZ0luc3RhbmNlLmRhdGFDZWxsQ2xhc3MpLmZvckVhY2goZnVuY3Rpb24oY2VsbCwgY2VsbE51bWJlcikge1xuXHRcdFx0dXBkYXRlQ2VsbChjZWxsLCB0YWJsZVV0aWwuZ2V0Rml4ZWRDZWxsKGNvbmZpZ0luc3RhbmNlLnRvcENlbGxPZmZzZXQgKyByb3dOdW1iZXIsIGNlbGxOdW1iZXIpKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0RWRpdGluZ0NlbGwob25JbnB1dEJsdXJFdmVudEhhbmRsZXIpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBjb25maWdJbnN0YW5jZS52aXJ0dWFsVGFibGVDbGFzcyArICcgdGQuJyArIGNvbmZpZ0luc3RhbmNlLmVkaXRpbmdDZWxsQ2xhc3MpLmZvckVhY2goZnVuY3Rpb24oZWRpdGluZ0NlbGwpIHtcblx0XHR2YXIgaW5wdXQgPSBlZGl0aW5nQ2VsbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuXG5cdFx0aW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0XHRlZGl0aW5nQ2VsbC5pbm5lckhUTUwgPSBpbnB1dC52YWx1ZTtcblx0XHRlZGl0aW5nQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZ0luc3RhbmNlLmVkaXRpbmdDZWxsQ2xhc3MpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRFZGl0ZWRDZWxsKCkge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZ0luc3RhbmNlLnZpcnR1YWxUYWJsZUNsYXNzICsgJyB0ZC4nICsgY29uZmlnSW5zdGFuY2UuZWRpdGluZ0NlbGxDbGFzcykuZm9yRWFjaChmdW5jdGlvbihlZGl0ZWRDZWxsKSB7XG5cdFx0ZWRpdGVkQ2VsbC5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZ0luc3RhbmNlLmVkaXRlZENlbGxDbGFzcyk7XG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLmVkaXRlZENlbGxzID0gW107XG5cdHVwZGF0ZVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lUYWJsZSgpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWdJbnN0YW5jZS5jb250YWluZXJTZWxlY3RvcikuaW5uZXJIVE1MID0gJyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbmRleE9mRWxlbWVudDogaW5kZXhPZkVsZW1lbnQsXG5cdHVwZGF0ZUNlbGw6IHVwZGF0ZUNlbGwsXG5cdHVwZGF0ZVRhYmxlOiB1cGRhdGVUYWJsZSxcblx0cmVzZXRFZGl0aW5nQ2VsbDogcmVzZXRFZGl0aW5nQ2VsbCxcblx0cmVzZXRFZGl0ZWRDZWxsOiByZXNldEVkaXRlZENlbGwsXG5cdGRlc3Ryb3lUYWJsZTogZGVzdHJveVRhYmxlXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjEsXCIuL3RhYmxlXCI6MTN9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEFyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL21vZGVscy9ldmVudC1hcmd1bWVudHMnKSxcblx0dGFibGVVdGlsID0gcmVxdWlyZSgnLi90YWJsZScpLFxuXHRkb21VdGlsICAgPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBzYXZlQ2VsbHMoKSB7XG5cdGlmICghY29uZmlnSW5zdGFuY2UuZWRpdGFibGUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbE9iamVjdDogY29uZmlnSW5zdGFuY2UuZWRpdGVkQ2VsbHMsXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLm9uQmVmb3JlU2F2ZShhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHRjb25maWdJbnN0YW5jZS5lZGl0ZWRDZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdHRhYmxlVXRpbC5zZXRDZWxsVmFsdWUoY2VsbC5yb3dOdW1iZXIsIGNlbGwuY29sdW1uTnVtYmVyLCBjZWxsLnZhbHVlKTtcblx0XHR9KTtcblx0XHRkb21VdGlsLnJlc2V0RWRpdGVkQ2VsbCgpO1xuXG5cdFx0Y29uZmlnSW5zdGFuY2Uub25BZnRlclNhdmUoYXJncyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHNhdmVDZWxsczogc2F2ZUNlbGxzXG59O1xufSx7XCIuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvblwiOjEsXCIuLi9tb2RlbHMvZXZlbnQtYXJndW1lbnRzXCI6MyxcIi4vZG9tXCI6OSxcIi4vdGFibGVcIjoxM31dLDExOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50QXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbW9kZWxzL2V2ZW50LWFyZ3VtZW50cycpO1xuXG52YXIgZG9tVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2RvbScpLFxuXHR0YWJsZVV0aWwgPSByZXF1aXJlKCcuLi91dGlscy90YWJsZScpLFxuXHRlZGl0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2VkaXQnKSxcblx0Z2VuZXJhdG9yVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRvcicpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG52YXIgY29udGFpbmVyO1xuXG5mdW5jdGlvbiBvbldoZWVsRXZlbnRIYW5kbGVyKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0Y29udGFpbmVyLnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVk7XG5cdGNvbnRhaW5lci5zY3JvbGxMZWZ0ICs9IGV2ZW50LmRlbHRhWDtcbn1cblxuZnVuY3Rpb24gb25TY3JvbGxFdmVudEhhbmRsZXIoKSB7XG5cdGRvbVV0aWwucmVzZXRFZGl0aW5nQ2VsbChvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cdGdlbmVyYXRvclV0aWwuaW5pdEJ1ZmZlcnMoY29uZmlnSW5zdGFuY2UpO1xuXHRkb21VdGlsLnVwZGF0ZVRhYmxlKCk7XG59XG5cbmZ1bmN0aW9uIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKCkge1xuXHR2YXIgY2VsbCA9IHRoaXMucGFyZW50Tm9kZSxcblx0XHRyb3dOdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KGNlbGwucGFyZW50Tm9kZSkgKyBjb25maWdJbnN0YW5jZS50b3BDZWxsT2Zmc2V0LFxuXHRcdGNvbHVtbk51bWJlciA9IGRvbVV0aWwuaW5kZXhPZkVsZW1lbnQoY2VsbCkgLSAxICsgY29uZmlnSW5zdGFuY2UubGVmdENlbGxPZmZzZXQsXG5cdFx0ZWRpdGVkT2JqID0gdGFibGVVdGlsLmdldENlbGwocm93TnVtYmVyLCBjb2x1bW5OdW1iZXIpO1xuXG5cdGVkaXRlZE9iai51cGRhdGVBdHRyaWJ1dGVzKHtcblx0XHR2YWx1ZTogdGhpcy52YWx1ZSxcblx0XHRjbGFzczogY29uZmlnSW5zdGFuY2UuZWRpdGVkQ2VsbENsYXNzXG5cdH0pO1xuXG5cdGlmICghdGFibGVVdGlsLmlzQ2VsbENoYW5nZWQoZWRpdGVkT2JqKSkge1xuXHRcdGRvbVV0aWwucmVzZXRFZGl0aW5nQ2VsbChvbklucHV0Qmx1ckV2ZW50SGFuZGxlcik7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbDogY2VsbCxcblx0XHRjZWxsT2JqZWN0OiBlZGl0ZWRPYmosXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLm9uVmFsaWRhdGlvbihhcmdzKTtcblxuXHRpZiAoYXJncy5jYW5jZWxFZGl0ICE9PSB0cnVlKSB7XG5cdFx0dGFibGVVdGlsLnNldFVwZGF0ZWRDZWxsVmFsdWUoYXJncy5jZWxsT2JqZWN0KTtcblx0XHRkb21VdGlsLnVwZGF0ZUNlbGwoYXJncy5jZWxsLCBhcmdzLmNlbGxPYmplY3QpO1xuXG5cdFx0Y29uZmlnSW5zdGFuY2Uub25BZnRlckVkaXQoYXJncyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DbGlja0NlbGxFdmVudEhhbmRsZXIoKSB7XG5cdGlmICghY29uZmlnSW5zdGFuY2UuZWRpdGFibGUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgcm93TnVtYmVyID0gZG9tVXRpbC5pbmRleE9mRWxlbWVudCh0aGlzLnBhcmVudE5vZGUpICsgY29uZmlnSW5zdGFuY2UudG9wQ2VsbE9mZnNldCxcblx0XHRjb2x1bW5OdW1iZXIgPSBkb21VdGlsLmluZGV4T2ZFbGVtZW50KHRoaXMpIC0gMSArIGNvbmZpZ0luc3RhbmNlLmxlZnRDZWxsT2Zmc2V0LFxuXHRcdGVkaXRlZE9iaiA9IHRhYmxlVXRpbC5nZXRDZWxsKHJvd051bWJlciwgY29sdW1uTnVtYmVyKSxcblx0XHRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0aW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuXHR2YXIgYXJncyA9IG5ldyBFdmVudEFyZ3VtZW50cyh7XG5cdFx0Y2VsbDogdGhpcyxcblx0XHRjZWxsT2JqZWN0OiBlZGl0ZWRPYmosXG5cdFx0Y2FuY2VsRXZlbnQ6IGZhbHNlXG5cdH0pO1xuXG5cdGNvbmZpZ0luc3RhbmNlLm9uQmVmb3JlRWRpdChhcmdzKTtcblxuXHRpZiAoIWFyZ3MuY2FuY2VsRXZlbnQpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5hZGQoY29uZmlnSW5zdGFuY2UuZWRpdGluZ0NlbGxDbGFzcyk7XG5cdFx0dGhpcy5jbGFzc0xpc3QucmVtb3ZlKGNvbmZpZ0luc3RhbmNlLmVkaXRlZENlbGxDbGFzcyk7XG5cdFx0dGhpcy5pbm5lckhUTUwgPSAnJztcblx0XHR0aGlzLmFwcGVuZENoaWxkKGlucHV0KTtcblxuXHRcdGlucHV0LmZvY3VzKCk7XG5cdFx0aW5wdXQudmFsdWUgPSBlZGl0ZWRPYmoudmFsdWU7XG5cdFx0aW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uSW5wdXRCbHVyRXZlbnRIYW5kbGVyKTtcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRFdmVudHMoKSB7XG5cdGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgY29uZmlnSW5zdGFuY2UudmlydHVhbENvbnRhaW5lckNsYXNzKTtcblxuXHRpZiAoY29udGFpbmVyICE9PSBudWxsKSB7XG5cdFx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb25XaGVlbEV2ZW50SGFuZGxlciwgeyBwYXNzaXZlOiBmYWxzZSwgY2FwdHVyZTogdHJ1ZSB9KTtcblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgb25TY3JvbGxFdmVudEhhbmRsZXIpO1xuXHR9XG5cblx0aWYgKGNvbmZpZ0luc3RhbmNlLmVkaXRhYmxlICYmIGNvbmZpZ0luc3RhbmNlLnNhdmVCdXR0b25TZWxlY3RvciAhPT0gbnVsbCkge1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29uZmlnSW5zdGFuY2Uuc2F2ZUJ1dHRvblNlbGVjdG9yKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGVkaXRVdGlsLnNhdmVDZWxscyk7XG5cdH1cblxuXHRpZiAoY29uZmlnSW5zdGFuY2UuZWRpdGFibGUpIHtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGNvbmZpZ0luc3RhbmNlLnZpcnR1YWxUYWJsZUNsYXNzICsgJyB0ZC4nICsgY29uZmlnSW5zdGFuY2UuZGF0YUNlbGxDbGFzcykuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkNsaWNrQ2VsbEV2ZW50SGFuZGxlcik7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRzKCkge1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGNvbmZpZ0luc3RhbmNlLnZpcnR1YWxDb250YWluZXJDbGFzcykucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgb25TY3JvbGxFdmVudEhhbmRsZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0b25DbGlja0NlbGxFdmVudEhhbmRsZXI6IG9uQ2xpY2tDZWxsRXZlbnRIYW5kbGVyLFxuXHRhZGRFdmVudHM6IGFkZEV2ZW50cyxcblx0cmVtb3ZlRXZlbnRzOiByZW1vdmVFdmVudHNcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL21vZGVscy9ldmVudC1hcmd1bWVudHNcIjozLFwiLi4vdXRpbHMvZG9tXCI6OSxcIi4uL3V0aWxzL2VkaXRcIjoxMCxcIi4uL3V0aWxzL2dlbmVyYXRvclwiOjEyLFwiLi4vdXRpbHMvdGFibGVcIjoxM31dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5pdENvbnRhaW5lcnMoaW5zdGFuY2UpIHtcblx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaW5zdGFuY2UuY29udGFpbmVyU2VsZWN0b3IpLFxuXHRcdHZpcnR1YWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHR2aXJ0dWFsVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuXHRcdGZpeGVkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0Zml4ZWRUYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XG5cblx0dmlydHVhbENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLnZpcnR1YWxDb250YWluZXJDbGFzcyk7XG5cdHZpcnR1YWxUYWJsZS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLnZpcnR1YWxUYWJsZUNsYXNzKTtcblx0Zml4ZWRDb250YWluZXIuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5maXhlZENvbnRhaW5lckNsYXNzKTtcblx0Zml4ZWRUYWJsZS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmZpeGVkVGFibGVDbGFzcyk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpeGVkQ29udGFpbmVyKTtcblx0Zml4ZWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZml4ZWRUYWJsZSk7XG5cblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxDb250YWluZXIpO1xuXHR2aXJ0dWFsQ29udGFpbmVyLmFwcGVuZENoaWxkKHZpcnR1YWxUYWJsZSk7XG5cblx0dmlydHVhbENvbnRhaW5lci5zdHlsZS5tYXhIZWlnaHQgPSBpbnN0YW5jZS5jb250YWluZXJIZWlnaHQgKyAncHgnO1xuXHR2aXJ0dWFsQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cblx0Zml4ZWRDb250YWluZXIuc3R5bGUucGFkZGluZyA9IGluc3RhbmNlLm1pbkNlbGxIZWlnaHQgKyAncHggMCc7XG5cdGZpeGVkQ29udGFpbmVyLnN0eWxlLmZsb2F0ID0gJ2xlZnQnO1xufVxuXG5mdW5jdGlvbiBpbml0VGFibGUoaW5zdGFuY2UpIHtcblx0Ly8gR2VuZXJhdGUgdmlydHVhbCB0YWJsZVxuXHR2YXIgdmlydHVhbFRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKSxcblx0XHR2aXJ0dWFsVGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpLFxuXHRcdHRySGVhZEJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cblx0dHJIZWFkQnVmZmVyLmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuYnVmZmVyUm93VG9wQ2xhc3MpO1xuXG5cdHZhciBpLCBqLCB0ckhlYWQsIHRyQm9keSwgYnVmZmVyQ29sdW1uTGVmdCwgYnVmZmVyQ29sdW1uUmlnaHQsIGJ1ZmZlclJvd0JvdHRvbSwgdGRFbGVtZW50O1xuXG5cdC8vIEdlbmVyYXRlIHZpcnR1YWwgaGVhZGVyXG5cdGJ1ZmZlckNvbHVtbkxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRidWZmZXJDb2x1bW5MZWZ0LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuYnVmZmVyQ29sdW1uTGVmdENsYXNzKTtcblxuXHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQoYnVmZmVyQ29sdW1uTGVmdCk7XG5cblx0Zm9yIChpID0gMDsgaSA8IGluc3RhbmNlLnZpc2libGVDb2x1bW5OdW1iZXI7IGkrKykge1xuXHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0fVxuXG5cdGJ1ZmZlckNvbHVtblJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0YnVmZmVyQ29sdW1uUmlnaHQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5idWZmZXJDb2x1bW5SaWdodENsYXNzKTtcblxuXHR0ckhlYWRCdWZmZXIuYXBwZW5kQ2hpbGQoYnVmZmVyQ29sdW1uUmlnaHQpO1xuXG5cdHZpcnR1YWxUaGVhZC5hcHBlbmRDaGlsZCh0ckhlYWRCdWZmZXIpO1xuXG5cdGluc3RhbmNlLmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXJSb3cpIHtcblx0XHR0ckhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRySGVhZC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmhlYWRlclJvd0NsYXNzKTtcblx0XHR0ckhlYWQuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmJ1ZmZlckNvbHVtbkxlZnRDbGFzcyk7XG5cblx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblxuXHRcdGZvciAoaiA9IDA7IGogPCBpbnN0YW5jZS52aXNpYmxlQ29sdW1uTnVtYmVyOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5oZWFkZXJDZWxsQ2xhc3MpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBoZWFkZXJSb3dbal0udGV4dCB8fCBoZWFkZXJSb3dbal0ua2V5IHx8ICcnO1xuXG5cdFx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmJ1ZmZlckNvbHVtblJpZ2h0Q2xhc3MpO1xuXG5cdFx0dHJIZWFkLmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGhlYWQuYXBwZW5kQ2hpbGQodHJIZWFkKTtcblx0fSk7XG5cblx0Ly8gR2VuZXJhdGUgdmlydHVhbCBib2R5XG5cdGZvciAoaSA9IDA7IGkgPCBpbnN0YW5jZS52aXNpYmxlUm93TnVtYmVyOyBpKyspIHtcblx0XHR0ckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXHRcdHRyQm9keS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmRhdGFSb3dDbGFzcyk7XG5cdFx0dHJCb2R5LnN0eWxlLmhlaWdodCA9IGluc3RhbmNlLmNlbGxIZWlnaHQgKyAncHgnO1xuXG5cdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5idWZmZXJDb2x1bW5MZWZ0Q2xhc3MpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgaW5zdGFuY2UudmlzaWJsZUNvbHVtbk51bWJlcjsgaisrKSB7XG5cdFx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdFx0dGRFbGVtZW50LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuZGF0YUNlbGxDbGFzcyk7XG5cdFx0XHR0ZEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSBpbnN0YW5jZS5jZWxsV2lkdGggKyAncHgnO1xuXG5cdFx0XHR0ckJvZHkuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHR0ZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuXHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmJ1ZmZlckNvbHVtblJpZ2h0Q2xhc3MpO1xuXG5cdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cblx0XHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQodHJCb2R5KTtcblx0fVxuXG5cdGJ1ZmZlclJvd0JvdHRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdGJ1ZmZlclJvd0JvdHRvbS5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmJ1ZmZlclJvd0JvdHRvbUNsYXNzKTtcblxuXHR2aXJ0dWFsVGJvZHkuYXBwZW5kQ2hpbGQoYnVmZmVyUm93Qm90dG9tKTtcblxuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnZpcnR1YWxUYWJsZUNsYXNzKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGhlYWQpO1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnZpcnR1YWxUYWJsZUNsYXNzKS5hcHBlbmRDaGlsZCh2aXJ0dWFsVGJvZHkpO1xuXG5cdGluc3RhbmNlLmJ1ZmZlckxlZnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIGluc3RhbmNlLmJ1ZmZlckNvbHVtbkxlZnRDbGFzcyk7XG5cdGluc3RhbmNlLmJ1ZmZlclJpZ2h0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBpbnN0YW5jZS5idWZmZXJDb2x1bW5SaWdodENsYXNzKTtcblx0aW5zdGFuY2UuYnVmZmVyVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLicgKyBpbnN0YW5jZS5idWZmZXJSb3dUb3BDbGFzcyk7XG5cdGluc3RhbmNlLmJ1ZmZlckJvdHRvbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgaW5zdGFuY2UuYnVmZmVyUm93Qm90dG9tQ2xhc3MpO1xuXG5cdC8vIEdlbmVyYXRlIGZpeGVkIHRhYmxlXG5cblx0aWYgKGluc3RhbmNlLmZpeGVkSGVhZGVycy5sZW5ndGggPT09IDApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgZml4ZWRUaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyksXG5cdFx0Zml4ZWRUYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rib2R5Jyk7XG5cblx0Ly8gR2VuZXJhdGUgZml4ZWQgaGVhZGVyXG5cblx0Zm9yIChpID0gMDsgaSA8IGluc3RhbmNlLmZpeGVkSGVhZGVycy5sZW5ndGg7IGkrKykge1xuXHRcdHRySGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJIZWFkLmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuaGVhZGVyUm93Q2xhc3MpO1xuXHRcdHRySGVhZC5zdHlsZS5oZWlnaHQgPSBpbnN0YW5jZS5jZWxsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdGZvciAoaiA9IDA7IGogPCBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG5cdFx0XHR0ZEVsZW1lbnQuY2xhc3NMaXN0LmFkZChpbnN0YW5jZS5oZWFkZXJDZWxsQ2xhc3MpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuY2VsbFdpZHRoICsgJ3B4Jztcblx0XHRcdHRkRWxlbWVudC5pbm5lckhUTUwgPSBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV1bal0udGV4dCB8fCBpbnN0YW5jZS5maXhlZEhlYWRlcnNbaV1bal0ua2V5IHx8ICcnO1xuXG5cdFx0XHR0ckhlYWQuYXBwZW5kQ2hpbGQodGRFbGVtZW50KTtcblx0XHR9XG5cblx0XHRmaXhlZFRoZWFkLmFwcGVuZENoaWxkKHRySGVhZCk7XG5cdH1cblxuXHQvLyBHZW5lcmF0ZSBmaXhlZCBib2R5XG5cblx0Zm9yIChpID0gMDsgaSA8IGluc3RhbmNlLnZpc2libGVSb3dOdW1iZXI7IGkrKykge1xuXHRcdHRyQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG5cdFx0dHJCb2R5LmNsYXNzTGlzdC5hZGQoaW5zdGFuY2UuZGF0YVJvd0NsYXNzKTtcblx0XHR0ckJvZHkuc3R5bGUuaGVpZ2h0ID0gaW5zdGFuY2UuY2VsbEhlaWdodCArICdweCc7XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgaW5zdGFuY2UuZml4ZWRIZWFkZXJzW2luc3RhbmNlLmluZGV4T2ZDZWxsS2V5SGVhZGVyXS5sZW5ndGg7IGorKykge1xuXHRcdFx0dGRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcblx0XHRcdHRkRWxlbWVudC5jbGFzc0xpc3QuYWRkKGluc3RhbmNlLmRhdGFDZWxsQ2xhc3MpO1xuXHRcdFx0dGRFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gaW5zdGFuY2UuY2VsbFdpZHRoICsgJ3B4JztcblxuXHRcdFx0dHJCb2R5LmFwcGVuZENoaWxkKHRkRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Zml4ZWRUYm9keS5hcHBlbmRDaGlsZCh0ckJvZHkpO1xuXHR9XG5cblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS5maXhlZFRhYmxlQ2xhc3MpLmFwcGVuZENoaWxkKGZpeGVkVGhlYWQpO1xuXHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLmZpeGVkVGFibGVDbGFzcykuYXBwZW5kQ2hpbGQoZml4ZWRUYm9keSk7XG59XG5cbmZ1bmN0aW9uIGluaXRCdWZmZXJzKGluc3RhbmNlKSB7XG5cdHZhciBsZWZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBpbnN0YW5jZS52aXJ0dWFsQ29udGFpbmVyQ2xhc3MpLnNjcm9sbExlZnQgLSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnZpcnR1YWxDb250YWluZXJDbGFzcykuc2Nyb2xsTGVmdCAlIGluc3RhbmNlLmNlbGxXaWR0aCAtIGluc3RhbmNlLmNvbHNwYW5PZmZzZXQgKiBpbnN0YW5jZS5jZWxsV2lkdGgsXG5cdFx0cmlnaHQgPSBpbnN0YW5jZS50YWJsZVdpZHRoIC0gbGVmdCxcblx0XHR0b3AgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIGluc3RhbmNlLnZpcnR1YWxDb250YWluZXJDbGFzcykuc2Nyb2xsVG9wLFxuXHRcdGJvdHRvbSA9IGluc3RhbmNlLnRhYmxlSGVpZ2h0IC0gdG9wO1xuXG5cdGxlZnQgPSBsZWZ0ID4gaW5zdGFuY2UudGFibGVXaWR0aCA/IGluc3RhbmNlLnRhYmxlV2lkdGggOiBsZWZ0O1xuXHRsZWZ0ID0gbGVmdCA8IDAgPyAwIDogbGVmdDtcblx0cmlnaHQgPSBpbnN0YW5jZS50YWJsZVdpZHRoIC0gbGVmdDtcblx0dG9wID0gdG9wICsgaW5zdGFuY2UubWluQ2VsbEhlaWdodCA+IGluc3RhbmNlLnRhYmxlSGVpZ2h0ID8gaW5zdGFuY2UudGFibGVIZWlnaHQgKyBpbnN0YW5jZS5taW5DZWxsSGVpZ2h0IDogdG9wICsgaW5zdGFuY2UubWluQ2VsbEhlaWdodDtcblx0Ym90dG9tID0gaW5zdGFuY2UudGFibGVIZWlnaHQgLSB0b3A7XG5cblx0aW5zdGFuY2UubGVmdENlbGxPZmZzZXQgPSBNYXRoLmZsb29yKGxlZnQgLyBpbnN0YW5jZS5jZWxsV2lkdGgpO1xuXHRpbnN0YW5jZS50b3BDZWxsT2Zmc2V0ID0gTWF0aC5mbG9vcigodG9wIC0gdG9wICUgaW5zdGFuY2UuY2VsbEhlaWdodCkgLyBpbnN0YW5jZS5jZWxsSGVpZ2h0KTtcblxuXHRpbnN0YW5jZS5idWZmZXJMZWZ0LmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5taW5XaWR0aCA9IGxlZnQgKyAncHgnO1xuXHR9KTtcblx0aW5zdGFuY2UuYnVmZmVyUmlnaHQuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGVsLnN0eWxlLm1pbldpZHRoID0gcmlnaHQgKyAncHgnO1xuXHR9KTtcblx0aW5zdGFuY2UuYnVmZmVyVG9wLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5oZWlnaHQgPSB0b3AgKyAncHgnO1xuXHR9KTtcblx0aW5zdGFuY2UuYnVmZmVyQm90dG9tLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRlbC5zdHlsZS5oZWlnaHQgPSBib3R0b20gKyAncHgnO1xuXHR9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXRUYWJsZTogaW5pdFRhYmxlLFxuXHRpbml0Q29udGFpbmVyczogaW5pdENvbnRhaW5lcnMsXG5cdGluaXRCdWZmZXJzOiBpbml0QnVmZmVyc1xufTtcbn0se31dLDEzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIENlbGwgPSByZXF1aXJlKCcuLi9tb2RlbHMvY2VsbCcpO1xuXG52YXIgY29uZmlnSW5zdGFuY2UgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMvY29uZmlndXJhdGlvbicpO1xuXG5mdW5jdGlvbiBnZXRDZWxsKHJvd051bWJlciwgY29sdW1uTnVtYmVyKSB7XG5cdHZhciBjZWxsT2JqID0gY29uZmlnSW5zdGFuY2UuZWRpdGVkQ2VsbHMuZmluZChmdW5jdGlvbihlbCkge1xuXHRcdFx0cmV0dXJuIGVsLnJvd051bWJlciA9PT0gcm93TnVtYmVyICYmIGVsLmNvbHVtbk51bWJlciA9PT0gY29sdW1uTnVtYmVyO1xuXHRcdH0pLFxuXHRcdHJvd09iaiA9IGNvbmZpZ0luc3RhbmNlLmhlYWRlcnNbY29uZmlnSW5zdGFuY2UuaW5kZXhPZkNlbGxLZXlIZWFkZXJdO1xuXG5cdGlmICh0eXBlb2YgY2VsbE9iaiA9PSAndW5kZWZpbmVkJykge1xuXHRcdGlmIChjb25maWdJbnN0YW5jZS5pc0RzU2ltcGxlKSB7XG5cdFx0XHRjZWxsT2JqID0gbmV3IENlbGwoe1xuXHRcdFx0XHRrZXk6IHJvd09ialtjb2x1bW5OdW1iZXJdLmtleSxcblx0XHRcdFx0dmFsdWU6IGNvbmZpZ0luc3RhbmNlLmRhdGFTb3VyY2Vbcm93TnVtYmVyXVtyb3dPYmpbY29sdW1uTnVtYmVyXS5rZXldXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2VsbE9iaiA9IG5ldyBDZWxsKGNvbmZpZ0luc3RhbmNlLmRhdGFTb3VyY2Vbcm93TnVtYmVyXS5maW5kKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRcdHJldHVybiBlbC5rZXkgPT09IHJvd09ialtjb2x1bW5OdW1iZXJdLmtleTtcblx0XHRcdH0pKTtcblx0XHR9XG5cblx0XHRjZWxsT2JqLnVwZGF0ZUF0dHJpYnV0ZXMoe1xuXHRcdFx0cm93TnVtYmVyOiByb3dOdW1iZXIsXG5cdFx0XHRjb2x1bW5OdW1iZXI6IGNvbHVtbk51bWJlclxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIGNlbGxPYmo7XG59XG5cbmZ1bmN0aW9uIGdldEZpeGVkQ2VsbChyb3dOdW1iZXIsIGNvbHVtbk51bWJlcikge1xuXHR2YXIgY2VsbE9iaiA9IG51bGwsXG5cdFx0cm93T2JqID0gY29uZmlnSW5zdGFuY2UuZml4ZWRIZWFkZXJzW2NvbmZpZ0luc3RhbmNlLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRpZiAoY29uZmlnSW5zdGFuY2UuaXNEc1NpbXBsZSkge1xuXHRcdGNlbGxPYmogPSBuZXcgQ2VsbCh7XG5cdFx0XHRrZXk6IHJvd09ialtjb2x1bW5OdW1iZXJdLmtleSxcblx0XHRcdHZhbHVlOiBjb25maWdJbnN0YW5jZS5kYXRhU291cmNlW3Jvd051bWJlcl1bcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5XVxuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdGNlbGxPYmogPSBuZXcgQ2VsbChjb25maWdJbnN0YW5jZS5kYXRhU291cmNlW3Jvd051bWJlcl0uZmluZChmdW5jdGlvbihlbCkge1xuXHRcdFx0cmV0dXJuIGVsLmtleSA9PT0gcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5O1xuXHRcdH0pKTtcblx0fVxuXG5cdHJldHVybiBjZWxsT2JqO1xufVxuXG5mdW5jdGlvbiBzZXRDZWxsVmFsdWUocm93TnVtYmVyLCBjb2x1bW5OdW1iZXIsIHZhbHVlKSB7XG5cdHZhciByb3dPYmogPSBjb25maWdJbnN0YW5jZS5oZWFkZXJzW2NvbmZpZ0luc3RhbmNlLmluZGV4T2ZDZWxsS2V5SGVhZGVyXTtcblxuXHRpZiAoY29uZmlnSW5zdGFuY2Uub3B0aW9ucy5pc0RzU2ltcGxlKSB7XG5cdFx0Y29uZmlnSW5zdGFuY2UuZGF0YVNvdXJjZVtyb3dOdW1iZXJdW3Jvd09ialtjb2x1bW5OdW1iZXJdLmtleV0gPSB2YWx1ZTtcblx0fSBlbHNlIHtcblx0XHRjb25maWdJbnN0YW5jZS5kYXRhU291cmNlW3Jvd051bWJlcl0uZmluZChmdW5jdGlvbihlbCkge1xuXHRcdFx0cmV0dXJuIGVsLmtleSA9PT0gcm93T2JqW2NvbHVtbk51bWJlcl0ua2V5O1xuXHRcdH0pLnZhbHVlID0gdmFsdWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gaXNDZWxsQ2hhbmdlZChjZWxsT2JqKSB7XG5cdHZhciBvcmlnaW5hbE9iaiA9IGdldENlbGwoY2VsbE9iai5yb3dOdW1iZXIsIGNlbGxPYmouY29sdW1uTnVtYmVyKSxcblx0XHRlZGl0ZWRPYmogPSBjb25maWdJbnN0YW5jZS5lZGl0ZWRDZWxscy5maW5kKGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRyZXR1cm4gZWwucm93TnVtYmVyID09PSBjZWxsT2JqLnJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNlbGxPYmouY29sdW1uTnVtYmVyO1xuXHRcdH0pLFxuXHRcdG9yaWdpbmFsVmFsID0gb3JpZ2luYWxPYmoudmFsdWUgfHwgJyc7XG5cblx0cmV0dXJuIG9yaWdpbmFsVmFsICE9PSBjZWxsT2JqLnZhbHVlIHx8IHR5cGVvZiBlZGl0ZWRPYmogIT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIHNldFVwZGF0ZWRDZWxsVmFsdWUoY2VsbE9iaikge1xuXHR2YXIgcHJldiA9IGNvbmZpZ0luc3RhbmNlLmVkaXRlZENlbGxzLmZpbmQoZnVuY3Rpb24oZWwpIHtcblx0XHRyZXR1cm4gZWwucm93TnVtYmVyID09PSBjZWxsT2JqLnJvd051bWJlciAmJiBlbC5jb2x1bW5OdW1iZXIgPT09IGNlbGxPYmouY29sdW1uTnVtYmVyO1xuXHR9KTtcblxuXHRpZiAodHlwZW9mIHByZXYgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRjb25maWdJbnN0YW5jZS5lZGl0ZWRDZWxscy5wdXNoKGNlbGxPYmopO1xuXHR9IGVsc2Uge1xuXHRcdHByZXYudmFsdWUgPSBjZWxsT2JqLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRDZWxsOiBnZXRDZWxsLFxuXHRnZXRGaXhlZENlbGw6IGdldEZpeGVkQ2VsbCxcblx0c2V0Q2VsbFZhbHVlOiBzZXRDZWxsVmFsdWUsXG5cdGlzQ2VsbENoYW5nZWQ6IGlzQ2VsbENoYW5nZWQsXG5cdHNldFVwZGF0ZWRDZWxsVmFsdWU6IHNldFVwZGF0ZWRDZWxsVmFsdWVcbn07XG59LHtcIi4uL2luc3RhbmNlcy9jb25maWd1cmF0aW9uXCI6MSxcIi4uL21vZGVscy9jZWxsXCI6Mn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxucmVxdWlyZSgnLi9wb2xseWZpbGxzL0FycmF5LmZpbmQuanMnKTtyZXF1aXJlKCcuL3BvbGx5ZmlsbHMvTm9kZUxpc3QuZm9yRWFjaC5qcycpO1xuXG52YXIgZ2VuZXJhdG9yID0gcmVxdWlyZSgnLi9tb2R1bGVzL2dlbmVyYXRvcicpO1xuXG52YXIgdW5pcXVlSWRTZXF1ZW5jZSA9IDE7XG5cbndpbmRvdy5WaXJ0dWFsRGF0YUdyaWQgPSBmdW5jdGlvbigpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYudW5pcXVlSWQgPSB1bmlxdWVJZFNlcXVlbmNlKys7XG5cdHNlbGYuZ2VuZXJhdGVUYWJsZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRnZW5lcmF0b3IuZ2VuZXJhdGVUYWJsZShzZWxmLnVuaXF1ZUlkLCBvcHRpb25zKTtcblx0fTtcblx0c2VsZi5kZXN0cm95VGFibGUgPSBnZW5lcmF0b3IuZGVzdHJveVRhYmxlO1xuXHRzZWxmLmdldElkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlbGYudW5pcXVlSWQ7XG5cdH07XG59O1xufSx7XCIuL21vZHVsZXMvZ2VuZXJhdG9yXCI6NSxcIi4vcG9sbHlmaWxscy9BcnJheS5maW5kLmpzXCI6NixcIi4vcG9sbHlmaWxscy9Ob2RlTGlzdC5mb3JFYWNoLmpzXCI6N31dfSx7fSxbMTRdKTtcbiJdLCJmaWxlIjoidmlydHVhbC1kYXRhLWdyaWQuanMifQ==
