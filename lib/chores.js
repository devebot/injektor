'use strict';

var debugx = require('./tracebug')('injektor:chores');

var chores = {};

chores.printExceptions = function(exceptions) {
  exceptions = exceptions || [];
  exceptions.forEach(function(err, index) {
    debugx.enabled && debugx('Error#%s', index);
    debugx.enabled && console.log('  name: %s\n  message: "%s"\n  stack: %s',
      err.name, err.message, err.stack);
  });
}

module.exports = chores;
