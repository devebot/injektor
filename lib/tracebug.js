'use strict';

var debug = null;

var tracebug = function(pkgName) {
  if (debug == null) {
    try {
      debug = require('debug');
    } catch(err) {
      debug = function() {
        return console.log;
      };
      debug.enabled = false;
    }
  }
  return debug(pkgName);
};

module.exports = tracebug;