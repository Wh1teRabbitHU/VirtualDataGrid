'use strict';

const selenium  = require('../modules/selenium');
const webdriver = require('../modules/webdriver');
const assert    = require('assert');
const mocha     = require('mocha');

const describe  = mocha.describe;
const it        = mocha.it;
const before    = mocha.before;
const after     = mocha.after;

let browser;

describe('Check the example page', function() {
	before(async() => {
		await selenium.startSelenium();
		browser = await webdriver();
	});

	it('The title is correctly displayed in the browser', async() => {
		await browser.url('/VirtualDataGrid/example');

		let title = await browser.getTitle();

		assert.equal(title, 'Virtual Data Grid', 'Wrong title: "' + title + '"');
	});

	after(async() => {
		await browser.deleteSession();
		await selenium.stopSelenium();
	});
});