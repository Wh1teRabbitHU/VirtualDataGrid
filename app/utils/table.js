'use strict';

var Cell = require('../models/cell');

var configInstance = require('../instances/configuration');

function getCell(rowNumber, columnNumber) {
	var cellObj = configInstance.inner.editedCells.find(function(el) {
			return el.rowNumber === rowNumber && el.columnNumber === columnNumber;
		}),
		rowObj = configInstance.headers[configInstance.inner.indexOfCellKeyHeader];

	if (typeof cellObj == 'undefined') {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
		});

		cellObj.updateAttributes({
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});
	}

	return cellObj;
}

function getFixedCell(rowNumber, columnNumber) {
	var cellObj = null,
		rowObj = configInstance.fixedHeaders[configInstance.inner.indexOfCellKeyHeader];

	cellObj = new Cell({
		key: rowObj[columnNumber].key,
		value: configInstance.dataSource[rowNumber][rowObj[columnNumber].key]
	});

	return cellObj;
}

function setCellValue(rowNumber, columnNumber, value) {
	var rowObj = configInstance.headers[configInstance.inner.indexOfCellKeyHeader];

	configInstance.dataSource[rowNumber][rowObj[columnNumber].key] = value;
}

function isCellChanged(cellObj) {
	var originalObj = getCell(cellObj.rowNumber, cellObj.columnNumber),
		editedObj = configInstance.inner.editedCells.find(function(el) {
			return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
		}),
		originalVal = originalObj.value || '';

	return originalVal !== cellObj.value || typeof editedObj != 'undefined';
}

function setUpdatedCellValue(cellObj) {
	var prev = configInstance.inner.editedCells.find(function(el) {
		return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
	});

	if (typeof prev == 'undefined') {
		configInstance.inner.editedCells.push(cellObj);
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