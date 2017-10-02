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

function generateTable(createNewInstance) {
	var headers = generateHeader(),
		data = generateData(headers);

	if (createNewInstance !== false) {
		virtualDG = new window.VirtualDataGrid();
	}

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
			customFilter: function(options) {
				function getMergedValue(row, attribute) {
					var editedRow = options.editedValues[row[options.uniqueRowKey]];

					return typeof editedRow == 'undefined' || typeof editedRow[attribute] == 'undefined' ? row[attribute] : editedRow[attribute];
				}

				return options.dataSource.filter(function(row) {
					return getMergedValue(row, options.attribute) < options.value;
				});
			}
		}
	});
}

function setupOptionContainer() {
	var generatorContainerHeight = window.innerHeight - document.querySelector('.main-container').getBoundingClientRect().top - 20;

	document.querySelector('.generator-container').style.maxHeight = generatorContainerHeight + 'px';
}

function setupOptions() {
	virtualDG = new window.VirtualDataGrid();

	Object.keys(virtualDG.DEFAULT_OPTIONS).forEach(function(key) {
		fillInputsWithOptions(key, virtualDG.DEFAULT_OPTIONS[key]);
	});
}

function fillInputsWithOptions(keyChain, value) {
	if (value !== null && typeof value === 'object') {
		Object.keys(value).forEach(function(subKey) {
			fillInputsWithOptions(keyChain + '-' + subKey, value[subKey]);
		});
	}

	var input = document.querySelector('[name=' + keyChain + ']');

	if (input !== null && typeof value !== 'function') {
		var inputType = input.getAttribute('type');

		if (inputType === 'radio' || inputType === 'checkbox') {
			document.querySelectorAll('[name=' + keyChain + ']').forEach(function(el) {
				el.checked = el.value === value + '';
			});
		} else {
			input.value = value;
		}
	}
}

function getOptionsFromInputs() {
	var inputs = document.querySelectorAll('[name]'),
		flatOptions = {},
		options = {};

	inputs.forEach(function(input) {
		var inputType = input.getAttribute('type'),
			isFunction = input.classList.contains('function'),
			isJson = input.classList.contains('json');

		if ((inputType === 'radio' || inputType === 'checkbox') && !input.matches(':checked')) {
			return;
		}

		var value = input.value;

		if (value === '') {
			return;
		}

		if (value === 'true') {
			value = true;
		} else if (value === 'false') {
			value = false;
		}

		if (isFunction) {
			value = evalFunctionValues(input);
		}

		if (isJson) {
			value = JSON.parse(input.value);
		}

		flatOptions[input.getAttribute('name')] = value;
	});

	Object.keys(flatOptions).forEach(function(flatKey) {
		var parts = flatKey.split('-'),
			partData = null;

		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];

			if (partData === null) {
				if (parts.length - 1 === i) {
					options[part] = flatOptions[flatKey];
				} else {
					if (typeof options[part] == 'undefined') {
						options[part] = {};
					}

					partData = options[part];
				}
			} else if (parts.length - 1 === i) {
				partData[part] = flatOptions[flatKey];
			} else {
				if (typeof partData[part] == 'undefined') {
					partData[part] = {};
				}

				partData = partData[part];
			}
		}
	});

	return options;
}

function evalFunctionValues(input) {
	var paramArray = input.getAttribute('data-attributes').split(',');

	return Function(paramArray, input.value); // eslint-disable-line
}

var isEventDelayed = false;

function resizeEventHandler() {
	if (!isEventDelayed) {
		isEventDelayed = true;

		window.setTimeout(function() {
			isEventDelayed = false;

			setupOptionContainer();
		}, 200);
	}
}

function initPage() {
	setupOptionContainer();
	setupOptions();
	getOptionsFromInputs();
}

window.addEventListener('load', function() {
	initPage();
	// generateTable(false);

	window.addEventListener('resize', resizeEventHandler);

	document.querySelector('#generate-table').addEventListener('click', function() {
		document.querySelector('.data-container').innerHTML = '';

		generateTable();
	});

	document.querySelector('#test-options').addEventListener('click', function() {
		window.console.log(getOptionsFromInputs());
	});

	document.querySelector('#generate-data').addEventListener('click', function() {
		var rows = document.querySelector('#datasource-generator-rows'),
			columns = document.querySelector('#datasource-generator-columns');

		if (rows === null || columns === null) {
			return;
		}

		window.console.log(rows.value, columns.value);
	});
});