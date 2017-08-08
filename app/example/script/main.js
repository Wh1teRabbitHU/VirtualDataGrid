'use strict';

function generateHeader() {
	var headers = [];

	headers.push([]);

	for (var i = 2; i < 201; i++) {
		headers[0].push({
			key: 'column_' + i,
			text: i + '. oszlop'
		});
	}

	return headers;
}

function generateFixedHeader() {
	var fixedHeaders = [];

	fixedHeaders.push([]);
	fixedHeaders[0].push({
		key: 'column_1',
		text: '1. oszlop'
	});

	return fixedHeaders;
}

function generateData(headers) {
	var ds = [];

	for (var i = 1; i <= 2000; i++) {
		var row = {
			column_1: i
		};

		for (var j = 1; j <= headers[0].length; j++) {
			var cKey = headers[0][j - 1].key;

			row[cKey] = i * (j + 1);
		}

		ds.push(row);
	}

	return ds;
}

window.addEventListener('load', function() {
	var headers = generateHeader(),
		data = generateData(headers),
		generator = new window.VirtualDataGrid();

	generator.generateTable({
		dataSource: data,
		headers: headers,
		fixedHeaders: generateFixedHeader(),
		selectors: {
			mainContainer: '.data-container'
		},
		edit: {
			enabled: true
		},
		sort: {
			enabled: true
		},
		filter: {
			enabled: false
		}
	});
});