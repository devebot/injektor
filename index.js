'use strict';

var errors = require('./lib/errors');
var Injektor = require('./lib/engine');

Injektor.errors = errors;

module.exports = Injektor;
