'use strict';

var configuration    = require('./configuration'),
	eventHandlerUtil = require('../utils/event-handler'),
	generatorUtil    = require('../utils/generator'),
	domUtil          = require('../utils/dom');

function generateTable(config, options) {
	configuration.init(config, options);

	generatorUtil.initTable(config);

	domUtil.updateBuffers(config);
	domUtil.updateTable(config);

	eventHandlerUtil.addEvents(config);
}

function destroyTable(config) {
	eventHandlerUtil.removeEvents(config);
	domUtil.destroyTable(config);
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable
};