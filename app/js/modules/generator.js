'use strict';

var configuration    = require('./configuration'),
	eventHandlerUtil = require('../utils/event-handler'),
	generatorUtil    = require('../utils/generator'),
	domUtil          = require('../utils/dom');

var configInstance   = require('../instances/configuration');

function generateTable(id, options) {
	configuration.init(options);

	generatorUtil.initTable(configInstance);
	generatorUtil.initBuffers(configInstance);

	domUtil.updateTable();

	eventHandlerUtil.addEvents();
}

function destroyTable() {
	eventHandlerUtil.removeEvents();
	domUtil.destroyTable();
}

module.exports = {
	generateTable: generateTable,
	destroyTable: destroyTable
};