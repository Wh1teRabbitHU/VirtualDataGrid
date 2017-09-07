'use strict';

var Cell       = require('../models/cell'),
	configUtil = require('../utils/configuration');

function getCellData(config, rowNumber, columnNumber) {
	var cellData = null,
		rowObj = configUtil.getKeyHeader(config),
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

		if (typeof config.dataSource[rowNumber].__editedValues != 'undefined' &&
			typeof config.dataSource[rowNumber].__editedValues[columnKey] != 'undefined') {

			cellData.class = config.selectors.editedCell;
			cellData.updateValue(config.dataSource[rowNumber].__editedValues[columnKey]);
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

function mergeEditedValuesInRow(row) {
	var mergedRowData = {};

	if (typeof row.__editedValues == 'undefined' || row.__editedValues === null) {
		return row;
	}

	Object.keys(row).forEach(function(key) {
		if (key !== '__editedValues') {
			mergedRowData[key] = row.__editedValues[key] || row[key];
		}
	});

	return mergedRowData;
}

function getUpdatedDataList(config) {
	var editedData = [];

	config.dataSource.forEach(function(row) {
		if (typeof row.__editedValues != 'undefined' && row.__editedValues !== null) {
			editedData.push(mergeEditedValuesInRow(row));
		}
	});

	return editedData;
}

function storeUpdatedCellValue(config, cellData) {
	if (typeof config.dataSource[cellData.rowNumber].__editedValues == 'undefined') {
		config.dataSource[cellData.rowNumber].__editedValues = {};
	}

	config.dataSource[cellData.rowNumber].__editedValues[cellData.key] = cellData.editedValue;
}

function persistCellValue(config) {
	config.dataSource.forEach(function(row) {
		if (typeof row.__editedValues != 'undefined' && row.__editedValues !== null) {
			Object.keys(row.__editedValues).forEach(function(key) {
				row[key] = row.__editedValues[key];
			});

			row.__editedValues = null;
		}
	});
}

module.exports = {
	getCellData: getCellData,
	getFixedCellData: getFixedCellData,
	mergeEditedValuesInRow: mergeEditedValuesInRow,
	getUpdatedDataList: getUpdatedDataList,
	storeUpdatedCellValue: storeUpdatedCellValue,
	persistCellValue: persistCellValue
};