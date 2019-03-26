'use strict';

const assert   = require('assert');
const mocha    = require('mocha');

const describe = mocha.describe;
const it       = mocha.it;

const wd       = require('../modules/webdriver');

describe('Check the example page', function() {

	it('The title is correctly displayed in the browser', async() => {
		let title = await wd.browser.getTitle();

		assert.equal(title, 'Virtual Data Grid', 'Wrong title: "' + title + '"');
	});

	it('The table generator button is present and it has the correct label', async() => {
		let generateTableBtn = await wd.browser.$('#generate-table');
		let buttonText = await generateTableBtn.getText();

		assert.equal(buttonText, 'Generate table');
	});

});