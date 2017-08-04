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