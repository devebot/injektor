var InjektorClass = function InjektorClass() {
    
  var dependencies = {};

  /**
   * Get the dependency. If the call is the first time, copy it (for object) or
   * instantiate if (for constructor).
   */
  var retrieve = function(name) {
    var record = dependencies[name];
    if (record == null) {
        throw new Error('No service registered with name: '+name);
    }
    if (record['cache'] == null) convert(name);
    return record['cache'];
  };
  
  /**
   * Converts the dependency from definition into an instance (object or service).
   */
  var convert = function(name) {
    var record = dependencies[name];
    if (record['type'] == 'service') {
      record['cache'] = instantiate(record['value']);
    } else {
      record['cache'] = record['value'];
    }
  };
  
  /**
   * Instantiates a constructor
   */
  var instantiate = function(fn) {
    var wrapper = function(args) {
      return fn.apply(this, args);
    };
    wrapper.prototype = fn.prototype;
    return new wrapper(getDependencies(fn));
  };
  
  /**
   * Extracts the dependencies of a constructor
   */
  var getDependencies = function(fn) {
    var params = getParameters(fn);
    return params.map(function(value) {
      return retrieve(value);
    });
  };

  var getParameters = function(fn) {
    var args = fn.toString()
      .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
      .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
      .split(/,/);
    if (args.length == 1 && args[0] == "") return [];
    return args;
  };

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

InjektorClass.ARGUMENTS_IN_JSON = 1;
InjektorClass.ARGUMENTS_IN_LIST = 2;

module.exports = InjektorClass;
