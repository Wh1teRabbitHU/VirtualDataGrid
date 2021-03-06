'use strict';

var Cell       = require('../models/data/cell'),
	configUtil = require('../utils/configuration');

function getCellData(config, rowNumber, columnNumber) {
	var cellData = null,
		headerObj = configUtil.getKeyHeader(config)[columnNumber],
		uniqueRowKey = null;

	// If the index is higher than the available rows number
	if (rowNumber >= config.dataSource.length) {
		cellData = new Cell({
			key: headerObj.key,
			value: '',
			dataType: headerObj.dataType
		});
	} else {
		uniqueRowKey = config.dataSource[rowNumber][config.uniqueRowKey];
		cellData = new Cell({
			key: headerObj.key,
			value: config.dataSource[rowNumber][headerObj.key],
			dataType: headerObj.dataType,
			rowNumber: rowNumber,
			columnNumber: columnNumber,
			validatorObject: headerObj.validatorObject,
			customValidator: headerObj.customValidator
		});

		if (typeof config.inner.editedValues[uniqueRowKey] != 'undefined' &&
			typeof config.inner.editedValues[uniqueRowKey][headerObj.key] != 'undefined') {

			cellData.class = config.selectors.editedCell;
			cellData.updateValue(config.inner.editedValues[uniqueRowKey][headerObj.key]);
		}
	}

	return cellData;
}

function getFixedCellData(config, rowNumber, columnNumber) {
	var cellData = null,
		headerObj = configUtil.getFixedKeyHeader(config)[columnNumber];

	// If the index is higher than the available rows number
	if (rowNumber >= config.dataSource.length) {
		cellData = new Cell({
			key: headerObj.key,
			value: '',
			dataType: headerObj.dataType
		});
	} else {
		cellData = new Cell({
			key: headerObj.key,
			value: config.dataSource[rowNumber][headerObj.key],
			dataType: headerObj.dataType,
			rowNumber: rowNumber,
			columnNumber: columnNumber,
			validatorObject: headerObj.validatorObject,
			customValidator: headerObj.customValidator
		});
	}

	return cellData;
}

function mergeEditedValuesInRow(config, row) {
	var mergedRowData = {},
		uniqueRowKey = row[config.uniqueRowKey];

	if (typeof config.inner.editedValues[uniqueRowKey] == 'undefined') {
		return row;
	}

	Object.keys(row).forEach(function(key) {
		mergedRowData[key] = config.inner.editedValues[uniqueRowKey][key] || row[key];
	});

	return mergedRowData;
}

function mergeEditedValuesInDataSource(config, ds) {
	var mergedDs = [];

	ds.forEach(function(row) {
		mergedDs.push(mergeEditedValuesInRow(config, row));
	});

	return mergedDs;
}

function separateValuesInDataSource(config, mergedDs) {
	var separatedDs = [];

	mergedDs.forEach(function(mergedRow) {
		var originalRow = config.inner.originalDataSource.find(function(row) {
			return row[config.uniqueRowKey] === mergedRow[config.uniqueRowKey];
		});

		if (typeof originalRow != 'undefined') {
			separatedDs.push(originalRow);
		}
	});

	return separatedDs;
}

function storeUpdatedCellValue(config, cellData) {
	var uniqueRowKey = config.dataSource[cellData.rowNumber][config.uniqueRowKey];

	if (typeof config.inner.editedValues[uniqueRowKey] == 'undefined') {
		config.inner.editedValues[uniqueRowKey] = {};
	}

	config.inner.editedValues[uniqueRowKey][cellData.key] = cellData.editedValue;
}

function persistRowValues(config, row) {
	var uniqueRowKey = row[config.uniqueRowKey];

	if (typeof config.inner.editedValues[uniqueRowKey] != 'undefined') {
		Object.keys(config.inner.editedValues[uniqueRowKey]).forEach(function(key) {
			row[key] = config.inner.editedValues[uniqueRowKey][key];
		});

		config.inner.editedValues[uniqueRowKey] = {};
	}
}

function persistBatchValues(config) {
	config.dataSource.forEach(function(row) {
		persistRowValues(config, row);
	});
}

module.exports = {
	getCellData: getCellData,
	getFixedCellData: getFixedCellData,
	mergeEditedValuesInRow: mergeEditedValuesInRow,
	mergeEditedValuesInDataSource: mergeEditedValuesInDataSource,
	separateValuesInDataSource: separateValuesInDataSource,
	storeUpdatedCellValue: storeUpdatedCellValue,
	persistRowValues: persistRowValues,
	persistBatchValues: persistBatchValues
};