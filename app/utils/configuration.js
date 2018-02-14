'use strict';

function getDefaultContainerHeight(config) {
	return window.innerHeight - document.querySelector(config.selectors.mainContainer).getBoundingClientRect().top -
			(config.headers.length + (config.filter.enabled ? 1 : 0)) * config.dimensions.cellHeight - 52;
}

function getIndexOfCellKeyHeader(config) {
	return config.headers.length - 1;
}

function getSortDefault(config) {
	return config.uniqueRowKey;
}

// Firefox using MouseEvent.DOM_DELTA_LINE || MouseEvent.DOM_DELTA_PAGE instead of exact pixels, when measuring scroll delta values.
// This function will give the exact line height for the pixel conversion
function getScrollLineHeight() {
	var iframe = document.createElement('iframe');

	iframe.src = '#';
	document.body.appendChild(iframe);

	var iwin = iframe.contentWindow,
		idoc = iwin.document;

	idoc.open();
	idoc.write('<!DOCTYPE html><html><head></head><body><span>a</span></body></html>');
	idoc.close();

	var span = idoc.body.firstElementChild,
		r = span.offsetHeight;

	document.body.removeChild(iframe);

	return r;
}

// Firefox using MouseEvent.DOM_DELTA_LINE || MouseEvent.DOM_DELTA_PAGE instead of exact pixels, when measuring scroll delta values.
// This function will give the exact page height for the pixel conversion
function getScrollPageHeight() {
	return window.document.body.clientHeight;
}

function getCellFullWidth(config) {
	return config.dimensions.cellPaddingHorizontal * 2 + config.dimensions.cellWidth + config.dimensions.cellBorderWidth;
}

function getKeyHeader(config) {
	return config.headers[config.inner.indexOfCellKeyHeader];
}

function getFixedKeyHeader(config) {
	return config.fixedHeaders[config.inner.indexOfCellKeyHeader];
}

function getHeaderObject(config, attribute) {
	return getKeyHeader(config).find(function(column) {
		return column.key === attribute;
	}) || getFixedKeyHeader(config).find(function(column) {
		return column.key === attribute;
	});
}

function nil() {
	return function() {};
}

function wrapper(f) {
	return function() { return f; };
}

module.exports = {
	getDefaultContainerHeight: getDefaultContainerHeight,
	getIndexOfCellKeyHeader: getIndexOfCellKeyHeader,
	getSortDefault: getSortDefault,
	getScrollLineHeight: getScrollLineHeight,
	getScrollPageHeight: getScrollPageHeight,
	getCellFullWidth: getCellFullWidth,
	getKeyHeader: getKeyHeader,
	getFixedKeyHeader: getFixedKeyHeader,
	getHeaderObject: getHeaderObject,
	nil: nil,
	wrapper: wrapper
};