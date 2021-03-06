'use strict';

var configUtil     = require('../utils/configuration'),
	dataUtil       = require('../utils/data'),
	tooltipDefault = require('../configs/defaults/tooltip');

var DEFAULTS = {
	selectors: {
		mainContainer: '.main-container',

		fixedContainer: 'fixed-container',
		fixedHeaderContainer: 'fixed-header-container',
		dataContainer: 'data-container',
		dataHeaderContainer: 'data-header-container',

		fixedTable: 'fixed-table',
		fixedHeaderTable: 'fixed-header-table',
		dataTable: 'data-table',
		dataHeaderTable: 'data-header-table',

		editingCell: 'editing-cell',
		editedCell: 'edited-cell',
		saveButton: null
	},
	dimensions: {
		cellWidth: 150,
		cellHeight: 50,
		cellPaddingVertical: 4,
		cellPaddingHorizontal: 8,
		cellBorderWidth: 1,
		containerPaddingBottom: 54,
		containerHeight: configUtil.getDefaultContainerHeight,
		lockCellHeight: false
	},
	edit: {
		enabled: false,
		mode: 'batch',
		validate: false
	},
	filter: {
		enabled: false,
		customFilter: null
	},
	sort: {
		enabled: false,
		default: configUtil.getSortDefault,
		customSort: null
	},
	eventHandlers: {
		onBeforeEdit: configUtil.nil,
		onValidation: configUtil.nil,
		onAfterEdit: configUtil.nil,
		onBeforeSave: configUtil.nil,
		onSaveRow: configUtil.nil,
		onSaveBatch: configUtil.nil,
		onAfterSave: configUtil.nil
	},
	locale: {
		name: 'en'
	},
	dataSource: [ ],
	headers: [ [ ] ],
	fixedHeaders: [ [ ] ],
	uniqueRowKey: '__uniqueRowKey',
	autoResize: true,
	debug: false,
	uniqueId: 0,
	modules: {
		tooltip: {
			enabled: true,
			show: configUtil.wrapper(tooltipDefault.show),
			hide: configUtil.wrapper(tooltipDefault.hide),
			hideAll: configUtil.wrapper(tooltipDefault.hideAll),
			showInfo: configUtil.wrapper(tooltipDefault.showInfo),
			showWarn: configUtil.wrapper(tooltipDefault.showWarn),
			showError: configUtil.wrapper(tooltipDefault.showError)
		}
	},
	inner: {}
};

var HEADER_DEFAULTS = {
	dataType: 'text',
	filterType: 'equals',
	filterDisabled: false,
	sortDisabled: false,
	validatorObject: {},
	customValidator: null
};

var STATIC_INNER_ATTRS = {
	selectors: {
		uniqueIdPrefix: 'virtual-data-grid-',
		headerRow: 'header-row',
		headerCell: 'header-cell',
		bufferHeaderCell: 'buffer-header-cell',
		sortCell: 'sort-cell',
		sortIcon: 'sort-icon',
		sortDisabled: 'sort-disabled',
		filterRow: 'filter-row',
		filterCell: 'filter-cell',
		filterDisabled: 'filter-disabled',
		filterContainer: 'filter-container',
		filterSearchIcon: 'filter-search-icon',
		filterClearIcon: 'filter-clear-icon',
		filteredOutRow: 'filtered-out',
		dataRow: 'data-row',
		dataCell: 'data-cell',
		cellDataContainer: 'cell-data-container',
		overflowedCell: 'overflowed-cell'
	},
	dimensions: {},
	icons: {
		sort: {
			asc: 'fa fa-arrow-down',
			desc: 'fa fa-arrow-up'
		},
		filter: {
			search: 'fa fa-search',
			clear: 'fa fa-times'
		}
	},
	editedValues: { },
	sort: { },
	filters: { },
	minBufferWidth: 2,
};

function init(config, options) {
	initConfigObject(config);

	updateValue(config, options, 'selectors.mainContainer');
	updateValue(config, options, 'selectors.fixedContainer');
	updateValue(config, options, 'selectors.fixedHeaderContainer');
	updateValue(config, options, 'selectors.fixedTable');
	updateValue(config, options, 'selectors.fixedHeaderTable');
	updateValue(config, options, 'selectors.dataContainer');
	updateValue(config, options, 'selectors.dataHeaderContainer');
	updateValue(config, options, 'selectors.dataTable');
	updateValue(config, options, 'selectors.dataHeaderTable');
	updateValue(config, options, 'selectors.editingCell');
	updateValue(config, options, 'selectors.editedCell');
	updateValue(config, options, 'selectors.saveButton');

	updateValue(config, options, 'uniqueId');
	updateValue(config, options, 'headers');
	updateValue(config, options, 'locale.name');
	updateValue(config, options, 'dataSource');
	updateValue(config, options, 'fixedHeaders');
	updateValue(config, options, 'uniqueRowKey');
	updateValue(config, options, 'autoResize');

	updateValue(config, options, 'edit.enabled');
	updateValue(config, options, 'edit.mode');
	updateValue(config, options, 'edit.validate');
	updateValue(config, options, 'filter.enabled');
	updateValue(config, options, 'filter.customFilter');
	updateValue(config, options, 'sort.enabled');
	updateValue(config, options, 'sort.default');
	updateValue(config, options, 'sort.customSort');
	updateValue(config, options, 'debug');

	updateValue(config, options, 'dimensions.cellWidth');
	updateValue(config, options, 'dimensions.cellHeight');
	updateValue(config, options, 'dimensions.cellPaddingVertical');
	updateValue(config, options, 'dimensions.cellPaddingHorizontal');
	updateValue(config, options, 'dimensions.cellBorderWidth');
	updateValue(config, options, 'dimensions.containerPaddingBottom');
	updateValue(config, options, 'dimensions.containerHeight');
	updateValue(config, options, 'dimensions.lockCellHeight');

	updateValue(config, options, 'eventHandlers.onBeforeEdit');
	updateValue(config, options, 'eventHandlers.onValidation');
	updateValue(config, options, 'eventHandlers.onAfterEdit');
	updateValue(config, options, 'eventHandlers.onBeforeSave');
	updateValue(config, options, 'eventHandlers.onSaveRow');
	updateValue(config, options, 'eventHandlers.onSaveBatch');
	updateValue(config, options, 'eventHandlers.onAfterSave');

	// Tooltip module
	updateValue(config, options, 'modules.tooltip.enabled');
	updateValue(config, options, 'modules.tooltip.show');
	updateValue(config, options, 'modules.tooltip.hide');
	updateValue(config, options, 'modules.tooltip.hideAll');
	updateValue(config, options, 'modules.tooltip.showInfo');
	updateValue(config, options, 'modules.tooltip.showWarn');
	updateValue(config, options, 'modules.tooltip.showError');

	calculateUniqueIdSelector(config);

	initHeaderData(config);
	initDataSource(config, options.uniqueRowKey);
	initCalculatedValues(config);
}

function initConfigObject(config) {
	config.selectors = {};
	config.eventHandlers = {};
	config.locale = {};
	config.inner = dataUtil.cloneObject(STATIC_INNER_ATTRS);
}

function calculateUniqueIdSelector(config) {
	config.inner.selectors.uniqueId = config.inner.selectors.uniqueIdPrefix + config.uniqueId;
}

function initCalculatedValues(config) {
	// Annak a header sornak az indexe, ami a cella kulcsokat is meghatározza. Mivel ez mindig az utolsó lesz, ezért TODO: Kiszedni/átalakítani
	config.inner.indexOfCellKeyHeader = configUtil.getIndexOfCellKeyHeader(config);
	config.inner.originalDataSource = [].concat(config.dataSource);
	config.inner.dimensions.scrollLineHeight = configUtil.getScrollLineHeight();
	config.inner.dimensions.scrollPageHeight = configUtil.getScrollPageHeight();
}

function initHeaderData(config) {
	var processedHeaders = [],
		processedFixedHeaders = [];

	config.headers.forEach(function(headerRow) {
		var hRow = [];

		headerRow.forEach(function(headerCell) {
			if (typeof headerCell.dataType == 'undefined') {
				headerCell.dataType = HEADER_DEFAULTS.dataType;
			}

			if (typeof headerCell.filterType == 'undefined') {
				headerCell.filterType = HEADER_DEFAULTS.filterType;
			}

			if (typeof headerCell.filterDisabled == 'undefined') {
				headerCell.filterDisabled = HEADER_DEFAULTS.filterDisabled;
			}

			if (typeof headerCell.sortDisabled == 'undefined') {
				headerCell.sortDisabled = HEADER_DEFAULTS.sortDisabled;
			}

			if (typeof headerCell.validatorObject == 'undefined') {
				headerCell.validatorObject = HEADER_DEFAULTS.validatorObject;
			}

			if (typeof headerCell.customValidator == 'undefined') {
				headerCell.customValidator = HEADER_DEFAULTS.customValidator;
			}

			if (typeof headerCell.width == 'undefined') {
				headerCell.width = config.dimensions.cellWidth;
			}

			hRow.push(headerCell);

			if (typeof headerCell.colspan != 'undefined') {
				for (var i = 1; i < headerCell.colspan; i++) {
					hRow.push({});
				}
			}
		});

		processedHeaders.push(hRow);
	});

	config.fixedHeaders.forEach(function(headerRow) {
		var hRow = [];

		headerRow.forEach(function(headerCell) {
			if (typeof headerCell.dataType == 'undefined') {
				headerCell.dataType = HEADER_DEFAULTS.dataType;
			}

			if (typeof headerCell.filterType == 'undefined') {
				headerCell.filterType = HEADER_DEFAULTS.filterType;
			}

			if (typeof headerCell.filterDisabled == 'undefined') {
				headerCell.filterDisabled = HEADER_DEFAULTS.filterDisabled;
			}

			if (typeof headerCell.sortDisabled == 'undefined') {
				headerCell.sortDisabled = HEADER_DEFAULTS.sortDisabled;
			}

			if (typeof headerCell.width == 'undefined') {
				headerCell.width = config.dimensions.cellWidth;
			}

			hRow.push(headerCell);

			if (typeof headerCell.colspan != 'undefined') {
				for (var i = 1; i < headerCell.colspan; i++) {
					hRow.push({});
				}
			}
		});

		processedFixedHeaders.push(hRow);
	});

	config.headers = processedHeaders;
	config.fixedHeaders = processedFixedHeaders;
}

function initDataSource(config, uniqueRowKey) {
	if (typeof uniqueRowKey == 'undefined') {
		for (var i = 0; i < config.dataSource.length; i++) {
			config.dataSource[i][config.uniqueRowKey] = i;
		}
	}
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
	DEFAULTS: DEFAULTS
};