'use strict';

function invokeFn(name, param1, param2) {
	if (typeof window.tlite == 'undefined') {
		return;
	}

	window.tlite[name](param1, param2);
}

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
	invokeFn('hide', element);
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

	invokeFn('show', options.element, { grav: orientation });
}

function showWarn(options) {
	invokeFn('show', options.element);
}

function showError(config, options) {
	invokeFn('show', options.element);
}

module.exports = {
	show: show,
	hide: hide,
	hideAll: hideAll,
	showInfo: showInfo,
	showWarn: showWarn,
	showError: showError
};