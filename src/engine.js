'use strict';

var chores = require('./chores');
var errors = require('./errors');
var Validator = require('./validator');
var debugx = require('./pinbug')('injektor:engine');
var util = require('util');

var noop = function() {};
var ACCEPTED_SEPARATORS = ['/', ':', '@', '#', '$'];
var NAME_PATTERN_TMPL = '^[a-zA-Z]{1}[a-zA-Z0-9&\\-_%s]*$';

var defaultConfig = {
  argumentSchemaLabel: 'argumentSchema',
  argumentFieldsLabel: 'argumentProperties',
  namePatternTemplate: NAME_PATTERN_TMPL,
  referenceArrayLabel: 'referenceArray',
  isDependencyCycleDetected: true,
  isRelativeNameDuplicated: false,
  separator: '/',
  logger: { debug: noop, trace: noop, error: noop }
};

var Injektor = function Injektor(params) {
  debugx.enabled && debugx(' + constructor start ...');

  params = params || {};

  var config = {};
  Object.keys(defaultConfig).forEach(function(key) {
    switch(key) {
      case 'separator':
        if (ACCEPTED_SEPARATORS.indexOf(params[key]) >= 0) {
          config[key] = params[key];
        } else {
          config[key] = defaultConfig[key];
        }
        break;
      default:
        if (key in params) {
          config[key] = params[key];
        } else {
          config[key] = defaultConfig[key];
        }
    }
  });

  var namePatternStr = util.format(config.namePatternTemplate, config.separator);
  debugx.enabled && debugx(' - namePattern: %s', namePatternStr);

  var namePattern = new RegExp(namePatternStr, 'g');

  var validator = new Validator();

  var dependencies = {};
  var namestore = {};

  /**
   * Get the dependency. If the call is the first time, copy it (for object) or
   * instantiate if (for constructor).
   */
  function retrieve(name, options, exceptions) {
    options = options || {};
    exceptions = exceptions || [];
    var nameResolved = resolveName(name, options, exceptions);
    if (typeof nameResolved === 'string') {
      options = extractScope(nameResolved, options);
    }
    var record = dependencies[nameResolved];
    if (record == null) {
      var exception = new errors.DependencyNotFoundError('No dependency registered with name: ' + name);
      exceptions.push(exception);
      return undefined;
    }
    config.isDependencyCycleDetected && checkinStacktrace(nameResolved, options);
    record['cache'] = record['cache'] || convert(nameResolved, options, exceptions);
    config.isDependencyCycleDetected && checkoutStacktrace(nameResolved, options);
    return record['cache'];
  }

  /**
   * Converts the dependency from definition into an instance (object or service).
   */
  function convert(name, options, exceptions) {
    var result = undefined;
    var record = dependencies[name];
    if (record['type'] == 'service') {
      if (record['error'] == null) {
        try {
          var cachedObj = instantiate(record['value'], options, exceptions);
          if (exceptions.length === 0) result = cachedObj;
        } catch(exception) {
          debugx.enabled && debugx('convert("%s") has failed: %s/%s',
              name, exception.name, exception.message);
          record['error'] = exception;
          exceptions.push(exception);
          if (isFatalError(exception)) throw exception;
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
  function instantiate(fn, options, exceptions) {
    var wrapper = function(args) {
      return fn.apply(this, args);
    };
    wrapper.prototype = fn.prototype;
    return new wrapper(getDependencies(fn, options, exceptions));
  }

  /**
   * Extracts the dependencies of a constructor
   */
  function getDependencies(fn, options, exceptions) {
    if (fn[config.argumentSchemaLabel]) {
      var schema = fn[config.argumentSchemaLabel];
      if (schema instanceof Object && !(schema instanceof Array) &&
          (schema.properties == null || schema.properties instanceof Object) &&
          (schema.properties == null || !(schema.properties instanceof Array))) {
        var paramObject = {};
        var paramNames = Object.keys(schema.properties || {});
        for(var i=0; i<paramNames.length; i++) {
          paramObject[paramNames[i]] = retrieve(paramNames[i], options, exceptions);
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
          paramObject[argumentFields[i]] = retrieve(argumentFields[i], options, exceptions);
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
          paramArray.push(retrieve(refNames[i], options, exceptions));
        }
        return paramArray;
      } else {
        throw new errors.InvalidArgumentSchemaError('Constructor has invalid referenceArray descriptor');
      }
    } else {
      var params = extractArgumentNames(fn);
      return params.map(function(value) {
        return retrieve(value, options, exceptions);
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
      throw new errors.InvalidMethodArgumentError('dependency name is empty or not a string');
    }
    if (name.match(namePattern) == null) {
      throw new errors.InvalidMethodArgumentError('dependency name does not match the pattern');
    }
  }

  function extractScope(name, options) {
    options = options || {};
    var newopts = chores.cloneObject(options);
    var parts = name.split(config.separator);
    if (parts.length === 2) newopts.scope = parts[0];
    return newopts;
  }

  function checkinStacktrace(name, options) {
    options = options || {};
    options.stacktrace = options.stacktrace || [];
    options.stacktrace.push(name);
    if (options.stacktrace.length == 1) {
      debugx.enabled && debugx(' - (%s) => %s', name, JSON.stringify(options.stacktrace));
    } else {
      debugx.enabled && debugx(' - (%s) -> %s', name, JSON.stringify(options.stacktrace));
    }
    var pos = options.stacktrace.indexOf(name);
    if (pos != (options.stacktrace.length - 1)) {
      throw new errors.DependencyCycleDetectedError(util.format(
        'dependency cycle detected for "%s" at %s and %s in %s',
        name, (options.stacktrace.length - 1), pos, JSON.stringify(options.stacktrace)));
    }
  }

  function checkoutStacktrace(name, options) {
    options = options || {};
    options.stacktrace = options.stacktrace || [];
    options.stacktrace.pop();
    if (options.stacktrace.length > 0) {
      debugx.enabled && debugx(' - (%s) <- %s', name, JSON.stringify(options.stacktrace));
    } else {
      debugx.enabled && debugx(' - (%s) <= %s', name, JSON.stringify(options.stacktrace));
    }
  }

  function resolveName(name, options, exceptions) {
    options = options || {};
    var resolvedName = null;
    if (dependencies[name]) resolvedName = name;
    if (resolvedName == null && options.scope) {
      var fullname = [options.scope, name].join(config.separator);
      if (dependencies[fullname]) resolvedName = fullname;
    }
    if (resolvedName == null && namestore[name] && namestore[name].length > 0) {
      resolvedName = namestore[name][0];
      if (config.isRelativeNameDuplicated != true && namestore[name].length > 1) {
        var error = new errors.DuplicatedRelativeNameError('name [' + name + '] is duplicated');
        if (exceptions instanceof Array) {
          exceptions.push(error);
        } else {
          throw error;
        }
      }
    }
    return resolvedName;
  }

  function isFatalError(e) {
    return (e instanceof errors.DependencyNotFoundError) ||
        (e instanceof errors.DependencyCycleDetectedError)
  }

  /**
   * Registering an object as a dependency
   */
  this.registerObject = function(name, dependency, options) {
    validateName(name);
    var nameRef = parseName(config, name, options);
    dependencies[nameRef.absoluteName] = {type: 'object', value: dependency};
    updateSuggestion(namestore, nameRef);
    return this;
  };

  /**
   * Registering a singleton-service constructor as a dependency
   */
  this.defineService = function(name, dependency, options) {
    validateName(name);
    var record = splitArgumentArray(dependency);
    if (!record.serviceInit) {
      throw new errors.InvalidMethodArgumentError('invalid service descriptor');
    }
    if (record.referenceNames) {
      record.serviceInit.referenceArray = record.referenceNames;
    }
    var nameRef = parseName(config, name, options);
    dependencies[nameRef.absoluteName] = {type: 'service', value: record.serviceInit};
    updateSuggestion(namestore, nameRef);
    return this;
  };

  this.parseName = function(name, options) {
    var context = Object.assign({}, options);
    var exceptions = context.exceptions;
    delete context.exceptions;
    return parseName(name, context, exceptions);
  }

  this.resolve = function(name, options) {
    var context = Object.assign({}, options);
    var exceptions = context.exceptions;
    delete context.exceptions;
    return resolveName(name, context, exceptions);
  }

  this.resolveName = this.resolve;

  this.suggest = function(name) {
    if (dependencies[name]) return [];
    if (namestore[name]) {
      if (namestore[name].length === 0) {
        return [];
      } else {
        return namestore[name].slice();
      }
    }
    return null;
  }

  this.suggestName = this.suggest;

  /**
   * Lookups a dependency (object or service) from store 
   */
  this.lookup = function(name, options) {
    validateName(name);
    var isManaged = false;
    var exceptions = [];
    // extract exceptions from options
    if (chores.isArray(options)) {
      isManaged = true;
      exceptions = options;
      options = {};
    } else if (chores.isObject(options)) {
      isManaged = chores.isArray(options.exceptions);
      exceptions = options.exceptions = options.exceptions || [];
    }
    // retrieve object from storage
    var ref = retrieve(name, options, exceptions);
    if (!isManaged && exceptions.length > 0) {
      chores.printExceptions(exceptions);
      if (exceptions.length === 1) throw exceptions[0];
      throw new errors.DependencyCombinationError('lookup() is failed', exceptions);
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
    var options = {};
    var exceptions = [];
    var paramArray = getDependencies(record.serviceInit, options, exceptions);
    if (exceptions.length > 0) {
      chores.printExceptions(exceptions);
      if (exceptions.length === 1) throw exceptions[0];
      throw new errors.DependencyCombinationError('invoke() is failed', exceptions);
    }
    record.serviceInit.apply(null, paramArray);
  };

  Object.defineProperty(this, 'separator', {
    get: function() { return config.separator },
    set: function(val) {}
  });

  debugx.enabled && debugx(' - constructor end');
};

module.exports = Injektor;

function parseName(config, name, options) {
  options = options || {};
  var parts = name.split(config.separator);
  if (parts.length === 1) {
    if (options.scope) parts.unshift(options.scope);
  }
  if (parts.length === 0 || parts.length > 2) {
    throw new errors.InvalidMethodArgumentError('invalid name format');
  }
  var nameRef = {
    name: name,
    absoluteName: parts.join(config.separator),
    relativeName: parts[parts.length - 1],
    scope: parts[parts.length - 2]
  }
  return nameRef;
}

function updateSuggestion(namestore, nameRef) {
  if (nameRef.absoluteName != nameRef.relativeName) {
    namestore[nameRef.relativeName] = namestore[nameRef.relativeName] || [];
    if (namestore[nameRef.relativeName].indexOf(nameRef.absoluteName) < 0) {
      namestore[nameRef.relativeName].push(nameRef.absoluteName);
    }
  }
}
