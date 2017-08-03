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