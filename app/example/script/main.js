'use strict';

function generateHeader() {
	var headers = [];

	var i;

	headers.push([]);

	for (i = 2; i < 52; i++) {
		headers[0].push({
			key: 'column_main_main_' + i,
			text: i + '. oszlop',
			colspan: 4
		}, {}, {}, {});
	}

	headers.push([]);

	for (i = 2; i < 102; i++) {
		headers[1].push({
			key: 'column_main_' + i,
			text: i + '. oszlop',
			colspan: 2
		}, {});
	}

	headers.push([]);

	for (i = 2; i < 202; i++) {
		headers[2].push({
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
		key: 'column_main_main_1',
		text: ' '
	});

	fixedHeaders.push([]);
	fixedHeaders[1].push({
		key: 'column_main_1',
		text: ' '
	});

	fixedHeaders.push([]);
	fixedHeaders[2].push({
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

		for (var j = 1; j <= headers[2].length; j++) {
			var cKey = headers[2][j - 1].key;

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
			enabled: true
		}
	});
});