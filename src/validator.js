'use strict';

var Ajv = require('ajv');

var Constructor = function(params) {
  params = params || {};

  var validator = new Ajv(Object.assign({allErrors: true}, params.options));

  this.validate = function(data, schema, opts) {
    var output = { ok: true, hasErrors: false };
    var valid = validator.validate(schema, data);
    if (!valid) {
      output.ok = false;
      output.hasErrors = true;
      output.errors = validator.errors;
    }
    return output;
  }
}

module.exports = Constructor;
