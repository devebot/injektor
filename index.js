var InjektorClass = function InjektorClass() {

  var dependencies = {};

  /**
   * Get the dependency. If the call is the first time, copy it (for object) or
   * instantiate if (for constructor).
   */
  function retrieve(name) {
    var record = dependencies[name];
    if (record == null) {
        throw new Error('No service registered with name: ' + name);
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
    if (fn.argumentSchema) {
      var schema = fn.argumentSchema;
      if (schema instanceof Object && !(schema instanceof Array) &&
          schema.properties instanceof Object && !(schema.properties instanceof Array)) {
        var paramObject = {};
        var paramNames = Object.keys(schema.properties || {});
        for(var i=0; i<paramNames.length; i++) {
          paramObject[paramNames[i]] = retrieve(paramNames[i]);
        }
        return [paramObject];
      } else {
        throw new Error('constructor_has_invalid_argumentSchema');
      }
    } else {
      var params = getParameters(fn);
      return params.map(function(value) {
        return retrieve(value);
      });
    }
  }

  function getParameters(fn) {
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

  return this;
};

module.exports = InjektorClass;
