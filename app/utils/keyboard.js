'use strict';

var KEY_CODES = {
	ENTER: 13,
	ESCAPE: 27
};

function getKeyCode(event) {
	return event.keyCode || event.which;
}

module.exports = {
	getKeyCode: getKeyCode,
	KEY_CODES: KEY_CODES
};