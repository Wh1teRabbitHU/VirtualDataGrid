'use strict';

var Class = require('class-256.js');

module.exports = Class.extend(function() {
	var self = this;

	self.constructor = function(attributes, params) {
		if (typeof attributes == 'undefined') {
			return;
		}

		attributes.forEach(function(attr) {
			self[attr] = typeof params == 'undefined' || typeof params[attr] == 'undefined' ? null : params[attr];
		});
	};

	this.updateAttributes = function(attrs) {
		Object.keys(attrs).forEach(function(k) {
			if (typeof attrs[k] != 'undefined' && typeof self[k] != 'undefined') {
				self[k] = attrs[k];
			}
		});
	};
});