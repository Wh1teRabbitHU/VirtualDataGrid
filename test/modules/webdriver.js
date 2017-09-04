'use strict';

var webdriver = require('webdriverio');

var webdriverOptions = {
	desiredCapabilities: {
		maxInstances: 5,
		browserName: 'chrome'
	},
	baseUrl: 'http://localhost:3000',
	sync: true,
	coloredLogs: true,
	screenshotPath: './test/errorShots/'
};

function getClientInstance() {
	var client = webdriver.remote(webdriverOptions);

	client.on('error', function(err) {
		console.error(err);
	});

	return client;
}

module.exports = {
	getClientInstance: getClientInstance
};