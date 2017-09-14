'use strict';

require('./pollyfills/**/*.js', { mode: 'expand' });

var VirtualDataGrid = require('./models/module/virtual-data-grid');

window.VirtualDataGrid = VirtualDataGrid;