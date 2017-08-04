'use strict';

require('./pollyfills/**/*.js', { mode: 'expand' });

var VirtualDataGrid = require('./models/virtual-data-grid');

window.VirtualDataGrid = VirtualDataGrid;