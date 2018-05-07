'use strict';

var util = require('util');

var errors = {};
var stackTraceLimit = parseInt(process.env.ERROR_STACK_TRACE_LIMIT) || 100;

Object.defineProperty(errors, 'stackTraceLimit', {
  get: function() { return stackTraceLimit },
  set: function(val) {
    if (typeof val === 'number') {
      stackTraceLimit = val;
    }
  }
});

var CustomError = function(message, payload) {
  Error.call(this, message);
  this.message = message;
  this.payload = payload;
  var oldLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = stackTraceLimit;
  Error.captureStackTrace(this, this.constructor);
  Error.stackTraceLimit = oldLimit;
}
util.inherits(CustomError, Error);

var errorNames = [
  'DependencyNotFoundError',
  'DependencyCombinationError',
  'DependencyCycleDetectedError',
  'DuplicatedRelativeNameError',
  'InvalidMethodArgumentError',
  'InvalidArgumentSchemaError',
  'ValidatingArgumentError'
];

errorNames.forEach(function(errorName) {
  errors[errorName] = function() {
    CustomError.apply(this, arguments);
    this.name = errorName;
  }
  util.inherits(errors[errorName], CustomError);
});

module.exports = errors;
