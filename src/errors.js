'use strict';

var util = require('util');

var errors = {};

var errorNames = [
  'DependencyNotFoundError',
  'DependencyCombinationError',
  'DependencyCycleDetectedError',
  'DuplicatedRelativeNameError',
  'InvalidMethodArgumentError',
  'InvalidArgumentSchemaError',
  'ValidatingArgumentError'
];

var CustomError = function(message, payload) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
  this.payload = payload;
}
util.inherits(CustomError, Error);

errorNames.forEach(function(errorName) {
  errors[errorName] = function() {
    CustomError.apply(this, arguments);
    this.name = errorName;
  }
  util.inherits(errors[errorName], CustomError);
});

module.exports = errors;
