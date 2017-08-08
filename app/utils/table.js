'use strict';

var Cell = require('../models/cell');

function getCell(config, rowNumber, columnNumber) {
	var cellObj = config.inner.editedCells.find(function(el) {
			return el.rowNumber === rowNumber && el.columnNumber === columnNumber;
		}),
		rowObj = config.headers[config.inner.indexOfCellKeyHeader];

	if (rowNumber >= config.dataSource.length) {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: ''
		});
	}

	if (typeof cellObj == 'undefined') {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: config.dataSource[rowNumber][rowObj[columnNumber].key]
		});

		cellObj.updateAttributes({
			rowNumber: rowNumber,
			columnNumber: columnNumber
		});
	}

	return cellObj;
}

function getFixedCell(config, rowNumber, columnNumber) {
	var cellObj = null,
		rowObj = config.fixedHeaders[config.inner.indexOfCellKeyHeader];

	if (rowNumber >= config.dataSource.length) {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: ''
		});
	} else {
		cellObj = new Cell({
			key: rowObj[columnNumber].key,
			value: config.dataSource[rowNumber][rowObj[columnNumber].key]
		});
	}

	return cellObj;
}

function setCellValue(config, rowNumber, columnNumber, value) {
	var rowObj = config.headers[config.inner.indexOfCellKeyHeader];

	config.dataSource[rowNumber][rowObj[columnNumber].key] = value;
}

function isCellChanged(config, cellObj) {
	var originalObj = getCell(config, cellObj.rowNumber, cellObj.columnNumber),
		editedObj = config.inner.editedCells.find(function(el) {
			return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
		}),
		originalVal = originalObj.value || '';

	return originalVal !== cellObj.value || typeof editedObj != 'undefined';
}

function setUpdatedCellValue(config, cellObj) {
	var prev = config.inner.editedCells.find(function(el) {
		return el.rowNumber === cellObj.rowNumber && el.columnNumber === cellObj.columnNumber;
	});

	if (typeof prev == 'undefined') {
		config.inner.editedCells.push(cellObj);
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