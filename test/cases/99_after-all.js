'use strict';

const { afterAll }  = require('../modules/webdriver');
const mocha         = require('mocha');

const it            = mocha.it;
const describe      = mocha.describe;

describe('Close selenium and webdrive connections', function() {

	it('Successfully closed', async() => {
		await afterAll();
	});

});