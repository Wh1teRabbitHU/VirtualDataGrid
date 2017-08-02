'use strict';

require('./pollyfills/**/*.js', { mode: 'expand' });

var generator = require('./modules/generator');

var uniqueIdSequence = 1;

window.VirtualDataGrid = function() {
	var self = this;

	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.uniqueId, options);
	};
	self.destroyTable = generator.destroyTable;
	self.getId = function() {
		return self.uniqueId;
	};
};