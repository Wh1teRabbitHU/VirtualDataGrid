'use strict';

var dataUtil = require('../utils/data');

function createContainer(config) {
	var filterContainer       = document.createElement('div'),
		clearIconClass        = config.inner.icons.filter.clear,
		clearIconElementClass = config.inner.selectors.filterClearIcon + ' ' + clearIconClass;

	filterContainer.classList.add(config.inner.selectors.filterContainer);
	filterContainer.innerHTML = '<input><i class="' + clearIconElementClass + '" aria-hidden="true"></i>';

	return filterContainer;
}

function updateInput(config, cellNode, filterObj, headerObj, finishEditingFilter) {
	var filterContainer = cellNode.querySelector('.' + config.inner.selectors.filterContainer),
		filterInput = filterContainer.querySelector('input');

	filterInput.setAttribute('type', filterObj.dataType);
	filterInput.value = filterObj.value;
	filterInput.focus();
	filterInput.addEventListener('keyup', function(event) {
		if ((event.keyCode || event.which) === 13) { // Enter key
			filterObj.value = dataUtil.getValueByType(filterInput.value, filterObj.dataType);

			finishEditingFilter(config, cellNode, headerObj, filterObj);
		} else if ((event.keyCode || event.which) === 27) { // Escape key
			finishEditingFilter(config, cellNode, headerObj, filterObj);
		}
	});

	return filterInput;
}

module.exports = {
	createContainer: createContainer,
	updateInput: updateInput
};