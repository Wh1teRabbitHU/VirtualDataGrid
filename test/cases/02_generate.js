'use strict';

const mocha    = require('mocha');

const describe = mocha.describe;
const it       = mocha.it;

const wd       = require('../modules/webdriver');

describe('Check the generation process', function() {

	it('When the "Generate data" button pressed, the data generated successfully', async() => {
		let dataSourceTextarea = await wd.browser.$('[name=dataSource]');
		let tableSpaceFiller = await wd.browser.$('.space-filler');
		let generateDataBtn = await wd.browser.$('#generate-data');
		let generateTableBtn = await wd.browser.$('#generate-table');

		await generateDataBtn.click();
		await wd.browser.waitUntil(async() => {
			let textareaValue = await dataSourceTextarea.getValue();

			return textareaValue !== '';
		}, 10000, 'Awaiting timeout', 200);

		await generateTableBtn.click();
		await wd.browser.waitUntil(async() => {
			return !await tableSpaceFiller.isExisting();
		}, 10000, 'Awaiting timeout', 200);
	});

});