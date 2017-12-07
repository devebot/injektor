'use strict';

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var Constructor = function() {
  this.validate = function(data, schema, opts) {
    return validator.validate(data, schema);
  }
}

module.exports = Constructor;
