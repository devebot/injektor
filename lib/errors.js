'use strict';

var util = require('util');

Function.prototype.clone = function() {
    var that = this;
    var temp = function() {
      return that.apply(this, arguments);
    };
    Object.keys(that).forEach(function(key) {
      if (that.hasOwnProperty(key)) {
        temp[key] = that[key];
      }
    });
    return temp;
};

function CustomError(message, meta) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
  this.meta = meta;
}

var errors = {
  DependencyNotFoundError: CustomError.clone(),
  DependencyCombinationError: CustomError.clone(),
  InvalidMethodArgumentError: CustomError.clone(),
  InvalidArgumentSchemaError: CustomError.clone(),
  ValidatingArgumentError: CustomError.clone()
};

util.inherits(errors.DependencyNotFoundError, Error);
util.inherits(errors.DependencyCombinationError, Error);
util.inherits(errors.InvalidMethodArgumentError, Error);
util.inherits(errors.InvalidArgumentSchemaError, Error);
util.inherits(errors.ValidatingArgumentError, Error);

module.exports = errors;