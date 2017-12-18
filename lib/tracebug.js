'use strict';

var debug = null;

var tracebug = function(pkgName) {
  if (debug == null) {
    try {
      debug = require('debug');
    } catch(err) {
      debug = function() {
        var log = function() {
          return console.log.apply(console, arguments);
        }
        log.enabled = false;
        return log;
      };
    }
  }
  return debug(pkgName);
};

module.exports = tracebug;