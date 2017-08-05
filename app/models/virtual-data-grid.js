'use strict';

var generator = require('../modules/generator');

var uniqueIdSequence = 1;

function VirtualDataGrid() {
	var self = this;

	self.configuration = {};
	self.uniqueId = uniqueIdSequence++;
	self.generateTable = function(options) {
		generator.generateTable(self.configuration, options);
	};
	self.destroyTable = function() {
		generator.destroyTable(self.configuration);
	};
	self.getId = function() {
		return self.uniqueId;
	};
}

module.exports = VirtualDataGrid;