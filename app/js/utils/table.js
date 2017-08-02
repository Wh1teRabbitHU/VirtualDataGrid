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