'use strict';

function generateHeader() {
	var headers = [];

	headers.push([]);

	for (var i = 1; i < 201; i++) {
		headers[0].push({
			key: 'column_' + i,
			text: i + '. oszlop'
		});
	}

	return headers;
}

function generateData(headers) {
	var ds = [];

	for (var i = 1; i <= 2000; i++) {
		var row = {};

		for (var j = 1; j <= headers[0].length; j++) {
			var cKey = headers[0][j - 1].key;

			row[cKey] = i * j;
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
		containerSelector: '.data-container',
		dataSource: data,
		headers: headers,
		editable: true
	});
});