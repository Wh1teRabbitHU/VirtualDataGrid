'use strict';

const { beforeAll } = require('../modules/webdriver');
const mocha         = require('mocha');

const it            = mocha.it;
const describe      = mocha.describe;

describe('Initializing selenium and webdrive', function() {
	it('Successfully initialized', async() => {
		await beforeAll();
	});
});