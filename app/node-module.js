'use strict';

var VirtualDataGrid = require('./models/virtual-data-grid');

VirtualDataGrid.prototype.loadPollyfills = function() {
	require('./pollyfills/Array.find'); // eslint-disable-line global-require
	require('./pollyfills/NodeList.forEach'); // eslint-disable-line global-require
	require('./pollyfills/Object.assign'); // eslint-disable-line global-require
	require('./pollyfills/Element.matches'); // eslint-disable-line global-require
};

module.exports = VirtualDataGrid;