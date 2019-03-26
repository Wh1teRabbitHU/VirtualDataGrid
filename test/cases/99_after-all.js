'use strict';

const { afterAll }  = require('../modules/initializer');
const mocha         = require('mocha');

const it            = mocha.it;
const describe      = mocha.describe;

describe('Close selenium and webdrive connections', function() {

	it('Successfully closed', async() => {
		await afterAll();
	});

});