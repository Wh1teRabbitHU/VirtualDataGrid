'use strict';

const webdriver = require('webdriverio');
const selenium  = require('./selenium');

const webdriverOptions = {
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

const exportObject = {
	browser: null
};

exportObject.beforeAll = async() => {
	await selenium.startSelenium({ hasLogger: false });
	exportObject.browser = await webdriver.remote(webdriverOptions);
	await exportObject.browser.url('/VirtualDataGrid/example');
};

exportObject.afterAll = async() => {
	await exportObject.browser.deleteSession();
	await selenium.stopSelenium();
};

module.exports = exportObject;