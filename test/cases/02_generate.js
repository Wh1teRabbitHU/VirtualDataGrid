'use strict';

const mocha       = require('mocha');

const describe    = mocha.describe;
const it          = mocha.it;

const initializer = require('../modules/initializer');

describe('Check the generation process', function() {

	it('When the "Generate data" button pressed, the data generated successfully', async() => {
		let dataSourceTextarea = await initializer.browser.$('[name=dataSource]');
		let tableSpaceFiller = await initializer.browser.$('.space-filler');
		let generateDataBtn = await initializer.browser.$('#generate-data');
		let generateTableBtn = await initializer.browser.$('#generate-table');

		await generateDataBtn.click();
		await initializer.browser.waitUntil(async() => {
			let textareaValue = await dataSourceTextarea.getValue();

			return textareaValue !== '';
		}, 10000, 'Awaiting timeout', 200);

		await generateTableBtn.click();
		await initializer.browser.waitUntil(async() => {
			return !await tableSpaceFiller.isExisting();
		}, 10000, 'Awaiting timeout', 200);
	});

});