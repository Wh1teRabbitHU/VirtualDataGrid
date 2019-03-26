'use strict';

const selenium  = require('./selenium');
const webdriver = require('./webdriver');

const exportObject = {
	browser: null
};

exportObject.beforeAll = async() => {
	await selenium.startSelenium({ hasLogger: false });
	exportObject.browser = await webdriver();
	await exportObject.browser.url('/VirtualDataGrid/example');
};

exportObject.afterAll = async() => {
	await exportObject.browser.deleteSession();
	await selenium.stopSelenium();
};

module.exports = exportObject;