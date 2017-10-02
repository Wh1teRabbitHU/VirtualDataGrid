'use strict';

var generator = require('../../modules/generator');

var uniqueIdSequence = 1;

function VirtualDataGrid() {
	var self = this;

	self.configuration = {};
	self.uniqueId = uniqueIdSequence++;
	self.DEFAULT_OPTIONS = generator.getDefaultOptions();
	self.generateTable = function(options) {
		options.uniqueId = self.uniqueId;

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