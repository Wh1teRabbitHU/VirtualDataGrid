'use strict';

var requireDir = require('require-dir'),
	generator = require('./modules/generator');

var uniqueIdSequence = 1;

function VirtualDataGrid() {
	var self = this;

	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.uniqueId, options);
	};
	self.destroyTable = generator.destroyTable;
	self.getId = function() {
		return self.uniqueId;
	};
	self.loadPollyfills = function() { requireDir('./pollyfills'); };
}

module.exports = VirtualDataGrid;