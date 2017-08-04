'use strict';

var generator = require('./modules/generator');

var uniqueIdSequence = 1;

function loadPollyfills() {
	require('./pollyfills/Array.find'); // eslint-disable-line global-require
	require('./pollyfills/NodeList.forEach'); // eslint-disable-line global-require
}

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
	self.loadPollyfills = loadPollyfills;
}

module.exports = VirtualDataGrid;