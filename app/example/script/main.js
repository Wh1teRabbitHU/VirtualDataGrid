'use strict';

var virtualDG;

function generateHeaders(headerSize, headersRowSize) {
	var headers = [];

	for (var i = 0; i < headersRowSize; i++) {
		headers.push([]);

		for (var j = 1; j <= headerSize; j++) {
			headers[i].push({
				key: 'column_' + j,
				text: j + '. column',
				dataType: 'text'
			});
		}
	}

	return headers;
}

function generateData(headers, fixedHeaders, datasourceSize) {
	var ds = [],
		headersRowSize = headers.length,
		lastHeaderIndex = headersRowSize - 1;

	var i, j, row, cKey;

	for (i = 1; i <= datasourceSize; i++) {
		row = {
			column_1: i
		};

		for (j = 1; j <= headers[lastHeaderIndex].length; j++) {
			cKey = headers[lastHeaderIndex][j - 1].key;

			row[cKey] = (i * (j + 1)) + '. cell'; // eslint-disable-line
		}

		for (j = 1; j <= fixedHeaders[lastHeaderIndex].length; j++) {
			cKey = fixedHeaders[lastHeaderIndex][j - 1].key;

			row[cKey] = (i * (j + 1)) + '. cell'; // eslint-disable-line
		}

		ds.push(row);
	}

	return ds;
}

function generateDataGrid() {
	virtualDG = new window.VirtualDataGrid();
	virtualDG.generateTable(getOptionsFromInputs());
}

function setupOptionContainer() {
	var generatorContainerHeight = window.innerHeight - document.querySelector('.main-container').getBoundingClientRect().top - 20;

	document.querySelector('.generator-container').style.maxHeight = generatorContainerHeight + 'px';
	document.querySelector('.generator-container').style.height = generatorContainerHeight + 'px';
}

function setupOptions() {
	if (typeof virtualDG == 'undefined') {
		virtualDG = new window.VirtualDataGrid();
	}

	var inputs = document.querySelectorAll('[name]');

	if (inputs !== null) {
		inputs.forEach(function(input) {
			var inputType = input.getAttribute('type');

			if (inputType !== 'radio' && inputType !== 'checkbox') {
				input.value = null;
			}
		});
	}

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

	if (input !== null && typeof value !== 'function' && value !== null) {
		var inputType = input.getAttribute('type'),
			noDefault = input.getAttribute('data-no-default');

		if (noDefault === 'true') {
			return;
		} else if (inputType === 'radio' || inputType === 'checkbox') {
			document.querySelectorAll('[name=' + keyChain + ']').forEach(function(el) {
				el.checked = el.value === value + '';
			});
		} else if (typeof value == 'object') {
			input.value = JSON.stringify(value, null, 2);
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

		if (inputType === 'number') {
			value = parseInt(input.value, 10);
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
	var generateTableButton = document.querySelector('#generate-table'),
		testOptionsButton = document.querySelector('#test-options'),
		resetToDefaultButton = document.querySelector('#reset-to-default'),
		generateDataButton = document.querySelector('#generate-data');

	initPage();

	window.addEventListener('resize', resizeEventHandler);

	if (generateTableButton !== null) {
		generateTableButton.addEventListener('click', function() {
			var dataContainer = document.querySelector('.data-container');

			if (dataContainer !== null) {
				dataContainer.innerHTML = '';
			}

			generateDataGrid();
		});
	}

	if (testOptionsButton !== null) {
		testOptionsButton.addEventListener('click', function() {
			window.console.log(getOptionsFromInputs());
		});
	}

	if (resetToDefaultButton !== null) {
		resetToDefaultButton.addEventListener('click', setupOptions);
	}

	if (generateDataButton !== null) {
		generateDataButton.addEventListener('click', function() {
			var headersInput = document.querySelector('[name=headers]'),
				fixedHeadersInput = document.querySelector('[name=fixedHeaders]'),
				dataSourceInput = document.querySelector('[name=dataSource]'),
				headerSize = document.querySelector('#data-generator-header-size'),
				fixedHeaderSize = document.querySelector('#data-generator-fixed-header-size'),
				headersRowSize = document.querySelector('#data-generator-headers-row-size'),
				dataSize = document.querySelector('#data-generator-data-size');

			if (headersInput === null || fixedHeadersInput === null || dataSourceInput === null ||
				headerSize === null || fixedHeaderSize === null || headersRowSize === null || dataSize === null) {
				return;
			}

			var headerSizeValue = parseInt(headerSize.value, 10),
				fixedHeaderSizeValue = parseInt(fixedHeaderSize.value, 10),
				headersRowSizeValue = parseInt(headersRowSize.value, 10),
				dataSizeValue = parseInt(dataSize.value, 10),
				headers = generateHeaders(headerSizeValue, headersRowSizeValue),
				fixedHeaders = generateHeaders(fixedHeaderSizeValue, headersRowSizeValue),
				data = generateData(headers, fixedHeaders, dataSizeValue);

			headersInput.value = JSON.stringify(headers, null, 2);
			fixedHeadersInput.value = JSON.stringify(fixedHeaders, null, 2);
			dataSourceInput.value = JSON.stringify(data, null, 2);
		});
	}
});