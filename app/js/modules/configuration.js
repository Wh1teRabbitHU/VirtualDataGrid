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