'use strict';

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var Constructor = function() {
  this.validate = function(data, schema, opts) {
    var output = { ok: true, hasErrors: false };
    var result = validator.validate(data, schema);
    if (result.errors.length > 0) {
      output.ok = false;
      output.hasErrors = true;
      output.errors = result.errors;
    }
    return output;
  }
}

module.exports = Constructor;
