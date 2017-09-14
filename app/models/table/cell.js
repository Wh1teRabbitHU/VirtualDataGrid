'use strict';

function CellObject(p) {
	var self = this;

	initAttr('key');
	initAttr('value');
	initAttr('editedValue');
	initAttr('class');
	initAttr('rowNumber');
	initAttr('columnNumber');

	function initAttr(name) {
		self[name] = typeof p == 'undefined' || typeof p[name] == 'undefined' ? null : p[name];
	}

	this.updateAttributes = function(attrs) {
		Object.keys(attrs).forEach(function(k) {
			if (typeof attrs[k] != 'undefined' && typeof self[k] != 'undefined') {
				self[k] = attrs[k];
			}
		});
	};

	this.getValue = function() {
		return self.cellChanged ? self.editedValue : self.value;
	};

	this.updateValue = function(value) {
		if (self.value === value || self.value === null && typeof value == 'undefined') {
			self.editedValue = null;
			self.cellChanged = false;
		} else {
			self.editedValue = value;
			self.cellChanged = true;
		}
	};

	this.discardChangedValue = function() {
		self.editedValue = null;
	};

	this.isCellChanged = function() {
		return self.cellChanged;
	};
}

module.exports = CellObject;