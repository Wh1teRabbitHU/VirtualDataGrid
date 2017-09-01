'use strict';

var webdriver = require('../modules/webdriver'),
	selenium  = require('../modules/selenium'),
	assert    = require('assert'),
	mocha     = require('mocha');

var describe = mocha.describe,
	it       = mocha.it,
	before   = mocha.before,
	after    = mocha.after;

var client = webdriver.getClientInstance();

describe('DOM checks', function() {
	before(function(done) {
		selenium.startSelenium(done);
		client.init();
	});

	it('The title is correctly displayed in the browser', function(done) {
		client
			.url('/')
			.getTitle()
			.then(function(title) {
				assert.ok(title === 'Virtual Data Grid');
			})
			.call(done);
	});

	after(function(done) {
		client.end();
		selenium.stopSelenium(done);
	});
});