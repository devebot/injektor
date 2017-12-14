'use strict';

var errors = require('./errors');
var Validator = require('./validator');

var noop = function() {};

var defaultConfig = {
  argumentSchemaName: 'argumentSchema',
  argumentLineupName: 'argumentLineup',
  logger: { debug: noop, trace: noop, error: noop }
};

var Injektor = function Injektor(params) {
  params = params || {};
  
  var config = {};
  Object.keys(defaultConfig).forEach(function(key) {
    config[key] = params[key] || defaultConfig[key];
  });

  var validator = new Validator();

  var dependencies = {};

  /**
   * Get the dependency. If the call is the first time, copy it (for object) or
   * instantiate if (for constructor).
   */
  function retrieve(name) {
    var record = dependencies[name];
    if (record == null) {
        throw new errors.DependencyNotFoundError('No dependency registered with name: ' + name);
    }
    if (record['cache'] == null) convert(name);
    return record['cache'];
  }
  
  /**
   * Converts the dependency from definition into an instance (object or service).
   */
  function convert(name) {
    var record = dependencies[name];
    if (record['type'] == 'service') {
      record['cache'] = instantiate(record['value']);
    } else {
      record['cache'] = record['value'];
    }
  }
  
  /**
   * Instantiates a constructor
   */
  function instantiate(fn) {
    var wrapper = function(args) {
      return fn.apply(this, args);
    };
    wrapper.prototype = fn.prototype;
    return new wrapper(getDependencies(fn));
  }
  
  /**
   * Extracts the dependencies of a constructor
   */
  function getDependencies(fn) {
    if (fn[config.argumentSchemaName]) {
      var schema = fn[config.argumentSchemaName];
      if (schema instanceof Object && !(schema instanceof Array) &&
          schema.properties instanceof Object && !(schema.properties instanceof Array)) {
        var paramObject = {};
        var paramNames = Object.keys(schema.properties || {});
        for(var i=0; i<paramNames.length; i++) {
          paramObject[paramNames[i]] = retrieve(paramNames[i]);
        }
        var result = validator.validate(paramObject, schema);
        if (!result.ok) {
          throw new errors.ValidatingArgumentError('Constructor argument validation is failed');
        }
        return [paramObject];
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid argument schema descriptor');
      }
    } if (fn[config.argumentLineupName]) {
      var lineupInject = fn[config.argumentLineupName];
      if (lineupInject instanceof Array) {
        var paramArray = [];
        for(var i=0; i<lineupInject.length; i++) {
          paramArray.push(retrieve(lineupInject[i]));
        }
        return paramArray;
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid argument lineup descriptor');
      }
    } else {
      var params = extractArgumentNames(fn);
      return params.map(function(value) {
        return retrieve(value);
      });
    }
  }

  function extractArgumentNames(fn) {
    var args = fn.toString()
      .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
      .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
      .split(/,/);
    if (args.length == 1 && args[0] == "") return [];
    return args;
  }

  /**
   * Registering an object as a dependency
   */
  this.registerObject = function(name, dependency) {
    dependencies[name] = {type: 'object', value: dependency};
    return this;
  };

  /**
   * Registering a singleton-service constructor as a dependency
   */
  this.defineService = function(name, dependency) {
    dependencies[name] = {type: 'service', value: dependency};
    return this;
  };
  
  /**
   * Lookups a dependency (object or service) from store 
   */
  this.lookup = function(name) {
    return retrieve(name);
  };
  
  /**
   * Collects all dependencies of a service, pass them to and run the service
   */
  this.invoke = function(target) {
    target.apply(target, getDependencies(target));
  };
};

module.exports = Injektor;
