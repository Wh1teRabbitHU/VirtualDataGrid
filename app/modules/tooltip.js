'use strict';

function show(config, options) {
	switch (options.type) {
		case 'info':
			showInfo(config, options);
			break;
		case 'warn':
			showWarn(config, options);
			break;
		case 'error':
			showError(config, options);
			break;
		default:
			config.modules.tooltip.show(options);
			break;
	}
}

function hide(config, element) {
	config.modules.tooltip.hide(element);
}

function hideAll(config) {
	config.modules.tooltip.hideAll();
}

function showInfo(config, options) {
	config.modules.tooltip.showInfo(options);
}

function showWarn(config, options) {
	config.modules.tooltip.showWarn(options);
}

function showError(config, options) {
	config.modules.tooltip.showError(options);
}

function onMouseEnterCellWithTitle(config, element) {
	var cellDataContainer = element === null ? null : element.querySelector('.' + config.inner.selectors.cellDataContainer);

	if (cellDataContainer === null || !element.classList.contains(config.inner.selectors.overflowedCell)) {
		return;
	}

	showInfo(config, {
		element: element,
		text: element.getAttribute('title')
	});
}

function onMouseLeaveCellWithTitle(config, element) {
	hide(config, element);
}

module.exports = {
	show: show,
	hide: hide,
	hideAll: hideAll,
	showInfo: showInfo,
	showWarn: showWarn,
	showError: showError,
	onMouseEnterCellWithTitle: onMouseEnterCellWithTitle,
	onMouseLeaveCellWithTitle: onMouseLeaveCellWithTitle
};