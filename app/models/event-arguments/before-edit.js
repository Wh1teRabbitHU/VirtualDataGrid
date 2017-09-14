'use strict';

var BaseClass = require('../base');

var ATTRIBUTES = [
	'cellElement',
	'cellData',
	'cancelEvent'
];

module.exports = BaseClass.extend(function(parent) {
	var self = this;

	self.constructor = function(params) {
		parent.constructor.call(self, ATTRIBUTES, params);
	};
});