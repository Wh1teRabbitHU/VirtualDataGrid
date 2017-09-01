'use strict';

var selenium = require('selenium-standalone');

var seleniumOptions = {
	version: '3.5.0',
	baseURL: 'https://selenium-release.storage.googleapis.com',
	drivers: {
		chrome: {
			version: '2.32',
			arch: process.arch,
			baseURL: 'https://chromedriver.storage.googleapis.com'
		},
		firefox: {
			version: '0.18.0',
			arch: process.arch,
			baseURL: 'https://github.com/mozilla/geckodriver/releases/download'
		},
		ie: {
			version: '3.5.1',
			arch: process.arch,
			baseURL: 'https://selenium-release.storage.googleapis.com'
		},
		edge: {
			version: '15063'
		}
	}
};

var seleniumProcess = null;

function startSelenium(done, options) {
	if (typeof done == 'undefined') {
		done = function() {};
	}

	if (typeof options == 'undefined') {
		options = {
			hasLogger: true
		};
	}

	if (seleniumProcess === null) {
		initializeAndRun(function(process) {
			seleniumProcess = process;

			done();
		}, options);
	} else {
		done();
	}
}

function stopSelenium(done) {
	if (typeof done == 'undefined') {
		done = function() {};
	}

	if (seleniumProcess === null) {
		done();
	} else {
		setTimeout(function() { // It needs some delay to close the webdriver window
			seleniumProcess.kill();
			seleniumProcess = null;

			done();
		}, 100);
	}
}

function initializeAndRun(webdriverCallbackFn, options) {
	if (options.hasLogger) {
		seleniumOptions.logger = seleniumLogger;
	}

	console.log('\nStarting selenium\n');

	selenium.install(seleniumOptions, function(installError) {
		if (installError) {
			console.error(installError);
		}

		console.log('\nStarting webdriver cases\n');

		selenium.start(seleniumOptions, function(startError, child) {
			if (startError) {
				console.error(startError);
			}

			webdriverCallbackFn(child);
		});
	});
}

function seleniumLogger(msg) {
	console.log('[Selenium]: ' + msg);
}

module.exports = {
	startSelenium: startSelenium,
	stopSelenium: stopSelenium
};