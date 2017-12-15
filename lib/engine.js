'use strict';

var errors = require('./errors');
var Validator = require('./validator');
var debugx = require('./tracebug')('injektor:engine');

var noop = function() {};

var defaultConfig = {
  argumentSchemaLabel: 'argumentSchema',
  argumentFieldsLabel: 'argumentProperties',
  referenceArrayLabel: 'referenceArray',
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
  function retrieve(name, exceptions) {
    exceptions = exceptions || [];
    var record = dependencies[name];
    if (record == null) {
      var exception = new errors.DependencyNotFoundError('No dependency registered with name: ' + name);
      exceptions.push(exception);
      return undefined;
    }
    return record['cache'] = record['cache'] || convert(name, exceptions);
  }

  /**
   * Converts the dependency from definition into an instance (object or service).
   */
  function convert(name, exceptions) {
    var result = undefined;
    var record = dependencies[name];
    if (record['type'] == 'service') {
      if (record['error'] == null) {
        try {
          var cachedObj = instantiate(record['value'], exceptions);
          if (exceptions.length === 0) result = cachedObj;
        } catch(exception) {
          debugx.enabled && debugx('instantiate() has failed: %s/%s',
              exception.name, exception.message);
          record['error'] = exception;
          exceptions.push(exception);
        }
      }
    } else {
      result = record['value'];
    }
    return result;
  }

  /**
   * Instantiates a constructor
   */
  function instantiate(fn, exceptions) {
    var wrapper = function(args) {
      return fn.apply(this, args);
    };
    wrapper.prototype = fn.prototype;
    return new wrapper(getDependencies(fn, exceptions));
  }

  /**
   * Extracts the dependencies of a constructor
   */
  function getDependencies(fn, exceptions) {
    if (fn[config.argumentSchemaLabel]) {
      var schema = fn[config.argumentSchemaLabel];
      if (schema instanceof Object && !(schema instanceof Array) &&
          (schema.properties == null || schema.properties instanceof Object) &&
          (schema.properties == null || !(schema.properties instanceof Array))) {
        var paramObject = {};
        var paramNames = Object.keys(schema.properties || {});
        for(var i=0; i<paramNames.length; i++) {
          paramObject[paramNames[i]] = retrieve(paramNames[i], exceptions);
        }
        var result = validator.validate(paramObject, schema);
        if (!result.ok) {
          throw new errors.ValidatingArgumentError('Constructor argument validation is failed');
        }
        return [paramObject];
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid argumentSchema descriptor');
      }
    } else if (fn[config.argumentFieldsLabel]) {
      var argumentFields = fn[config.argumentFieldsLabel];
      if (argumentFields instanceof Array) {
        var paramObject = {};
        for(var i=0; i<argumentFields.length; i++) {
          paramObject[argumentFields[i]] = retrieve(argumentFields[i], exceptions);
        }
        return [paramObject];
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid argumentFields descriptor');
      }
    } else if (fn[config.referenceArrayLabel]) {
      var refNames = fn[config.referenceArrayLabel];
      if (refNames instanceof Array) {
        var paramArray = [];
        for(var i=0; i<refNames.length; i++) {
          paramArray.push(retrieve(refNames[i], exceptions));
        }
        return paramArray;
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid referenceArray descriptor');
      }
    } else {
      var params = extractArgumentNames(fn);
      return params.map(function(value) {
        return retrieve(value, exceptions);
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

  function splitArgumentArray(target) {
    if (typeof(target) === 'function') {
      return { serviceInit: target }
    }
    if (target instanceof Array) {
      if (target.length > 0) {
        target = target.slice();
        var callback = target.pop();
        if (typeof(callback) === 'function') {
          return {
            serviceInit: callback,
            referenceNames: target
          }
        }
      }
    }
    return {};
  }

  function validateName(name) {
    if (typeof(name) !== 'string' || name.length === 0) {
      throw new errors.InvalidMethodArgumentError('invalid dependency name');
    }
  }

  /**
   * Registering an object as a dependency
   */
  this.registerObject = function(name, dependency) {
    validateName(name);
    dependencies[name] = {type: 'object', value: dependency};
    return this;
  };

  /**
   * Registering a singleton-service constructor as a dependency
   */
  this.defineService = function(name, dependency) {
    validateName(name);
    var record = splitArgumentArray(dependency);
    if (!record.serviceInit) {
      throw new errors.InvalidMethodArgumentError('invalid service descriptor');
    }
    if (record.referenceNames) {
      record.serviceInit.referenceArray = record.referenceNames;
    }
    dependencies[name] = {type: 'service', value: record.serviceInit};
    return this;
  };

  /**
   * Lookups a dependency (object or service) from store 
   */
  this.lookup = function(name, exceptions) {
    validateName(name);
    var isManaged = (exceptions instanceof Array);
    exceptions = exceptions || [];
    var ref = retrieve(name, exceptions);
    if (!isManaged && exceptions.length > 0) {
      throw new errors.DependencyCombinationError('lookup() is failed');
    }
    return ref;
  };

  /**
   * Collects all dependencies of a service, pass them to and run the service
   */
  this.invoke = function(target) {
    var record = splitArgumentArray(target);
    if (!record.serviceInit) {
      throw new errors.InvalidMethodArgumentError('invalid callback descriptor');
    }
    record.serviceInit.referenceArray = record.referenceNames;
    var exceptions = [];
    var paramArray = getDependencies(record.serviceInit, exceptions);
    if (exceptions.length > 0) {
      throw new errors.DependencyCombinationError('invoke() is failed');
    }
    record.serviceInit.apply(null, paramArray);
  };
};

module.exports = Injektor;
