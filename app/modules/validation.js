'use strict';

var CUSTOM_VALIDATOR_ERROR_MSG = 'Custom validator error';

function validate(config, cellData) {
	if (!config.edit.validate) {
		return [];
	}

	var validationResult = [],
		customValidatorResult = cellData.customValidator === null ? null : cellData.customValidator(cellData);

	if (Array.isArray(customValidatorResult)) {
		validationResult = customValidatorResult;
	} else if (customValidatorResult === false) {
		validationResult.push(CUSTOM_VALIDATOR_ERROR_MSG);
	} else if (customValidatorResult !== null && customValidatorResult !== true) {
		validationResult.push(customValidatorResult);
	}

	return validationResult.concat(validateObject(cellData));
}

function validateObject(cellData) {
	var result = [],
		validatorObject = cellData.validatorObject;

	if (typeof validatorObject == 'undefined' || validatorObject === null) {
		return result;
	}

	Object.keys(validatorObject).forEach(function(key) {
		if (!checkValidationRules(cellData, key, validatorObject[key])) {
			var error = {};

			error[key] = validatorObject[key];

			result.push(error);
		}
	});

	return result;
}

function checkValidationRules(cellData, rule, referenceValue) {
	switch (rule) {
		case 'min':
			return cellData.getValue() >= referenceValue;
		case 'max':
			return cellData.getValue() <= referenceValue;
		default:
			return false;
	}
}

function showErrors(validationResult) {
	window.console.log(JSON.stringify(validationResult));
}

module.exports = {
	validate: validate,
	showErrors: showErrors
};