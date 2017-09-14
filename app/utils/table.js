'use strict';

var Cell       = require('../models/table/cell'),
	configUtil = require('../utils/configuration');

function getCellData(config, rowNumber, columnNumber) {
	var cellData = null,
		rowObj = configUtil.getKeyHeader(config),
		columnKey = rowObj[columnNumber].key,
		uniqueRowKey = null;

	// If the index is higher than the available rows number
	if (rowNumber >= config.dataSource.length) {
		cellData = new Cell({
			key: columnKey,
			value: ''
		});
	} else {
		uniqueRowKey = config.dataSource[rowNumber][config.uniqueRowKey];
		cellData = new Cell({
			key: columnKey,
			value: config.dataSource[rowNumber][columnKey],
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});

		if (typeof config.inner.editedValues[uniqueRowKey] != 'undefined' &&
			typeof config.inner.editedValues[uniqueRowKey][columnKey] != 'undefined') {

			cellData.class = config.selectors.editedCell;
			cellData.updateValue(config.inner.editedValues[uniqueRowKey][columnKey]);
		}
	}

	return cellData;
}

function getFixedCellData(config, rowNumber, columnNumber) {
	var cellData = null,
		rowObj = configUtil.getFixedKeyHeader(config),
		columnKey = rowObj[columnNumber].key;

	// If the index is higher than the available rows number
	if (rowNumber >= config.dataSource.length) {
		cellData = new Cell({
			key: columnKey,
			value: ''
		});
	} else {
		cellData = new Cell({
			key: columnKey,
			value: config.dataSource[rowNumber][columnKey],
			rowNumber: rowNumber,
			columnNumber: columnNumber
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