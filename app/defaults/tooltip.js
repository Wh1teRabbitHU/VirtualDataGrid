'use strict';

var tlite = window.tlite;

function show(options) {
	switch (options.type) {
		case 'info':
			showInfo(options);
			break;
		case 'warn':
			showWarn(options);
			break;
		case 'error':
			showError(options);
			break;
		default:
			showInfo(options);
			break;
	}
}

function hide(element) {
	tlite.hide(element);
}

function hideAll() {
	document.querySelectorAll('.tlite').forEach(function(el) {
		hide(el.parentNode);
	});
}

function showInfo(options) {
	var orientation = 's';

	if (options.element.matches('.header-cell')) {
		orientation = 'n';
	}

	tlite.show(options.element, { grav: orientation });
}

function showWarn(options) {
	tlite.show(options.element);
}

function showError(config, options) {
	tlite.show(options.element);
}

module.exports = {
	show: show,
	hide: hide,
	hideAll: hideAll,
	showInfo: showInfo,
	showWarn: showWarn,
	showError: showError
};