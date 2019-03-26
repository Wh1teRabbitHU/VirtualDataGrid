'use strict';

var webdriver = require('webdriverio');

var webdriverOptions = {
	maxInstances: 5,
	capabilities: {
		browserName: 'chrome'
	},
	baseUrl: 'https://wh1terabbithu.github.io',
	logLevel: 'warn',
	sync: true,
	coloredLogs: true,
	screenshotPath: './test/errorShots/',
	framework: 'mocha',
	mochaOpts: {
		ui: 'bdd',
		timeout: 90000
	}
};

module.exports = async() => await webdriver.remote(webdriverOptions);