'use strict';

var debugx = require('./tracebug')('injektor:chores');

var chores = {};

chores.cloneObject = function(obj) {
  return Object.assign({}, obj);
}

chores.isArray = function(arg) {
  return (arg instanceof Array);
}

chores.isObject = function(obj) {
  return (typeof(obj) === 'object')
      && (obj != null)
      && (obj instanceof Array == false);
}

chores.printExceptions = function(exceptions) {
  exceptions = exceptions || [];
  exceptions.forEach(function(err, index) {
    debugx.enabled && debugx('Error#%s', index);
    debugx.enabled && console.log('  name: %s\n  message: "%s"\n  stack: %s',
      err.name, err.message, err.stack);
  });
}

module.exports = chores;
