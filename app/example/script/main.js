'use strict';

var virtualDG;

function generateHeader() {
	var headers = [];

	var i;

	headers.push([]);

	for (i = 2; i < 52; i++) {
		headers[0].push({
			text: i + '. column',
			colspan: 4
		});
	}

	headers.push([]);

	for (i = 2; i < 102; i++) {
		headers[1].push({
			text: i + '. column',
			colspan: 2
		});
	}

	headers.push([]);
	headers[2].push({
		key: 'column_2',
		text: '2. column',
		dataType: 'number',
		filterDisabled: true,
		sortDisabled: true
	});
	headers[2].push({
		key: 'column_3',
		text: '3. column',
		dataType: 'number',
		filterType: 'custom',
	});

	for (i = 4; i < 202; i++) {
		headers[2].push({
			key: 'column_' + i,
			text: i + '. column',
			dataType: 'number'
		});
	}

	return headers;
}

function generateFixedHeader() {
	var fixedHeaders = [];

	fixedHeaders.push([]);
	fixedHeaders[0].push({
		text: ' '
	});

	fixedHeaders.push([]);
	fixedHeaders[1].push({
		text: ' '
	});

	fixedHeaders.push([]);
	fixedHeaders[2].push({
		key: 'column_1',
		text: '1. column',
		dataType: 'number'
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

function generateTable() {
	var headers = generateHeader(),
		data = generateData(headers);

	virtualDG = new window.VirtualDataGrid();
	virtualDG.generateTable({
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
			enabled: true,
			customFilter: function(ds, attr, val) {
				return ds.filter(function(row) {
					return row[attr] < val;
				});
			}
		}
	});
}

window.addEventListener('load', function() {
	generateTable();

	document.querySelector('.overwrite-data-grid').addEventListener('click', function() {
		document.querySelector('.data-container').innerHTML = '';

		// virtualDG.destroyTable();

		generateTable();
	});
});