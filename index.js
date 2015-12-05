var InjektorClass = function InjektorClass() {
    
    var dependencies = {};
    
    var retrieve = function(name) {
        var record = dependencies[name];
        if (record == null) {
            throw new Error('No service registered with name: '+name);
        }
        if (record['cache'] == null) convert(name);
        return record['cache'];
    };
    
    var convert = function(name) {
        var record = dependencies[name];
        if (record['type'] == 'service') {
            record['cache'] = instantiate(record['value']);
        } else {
            record['cache'] = record['value'];
        }
    };
    
    var instantiate = function(fn) {
        var wrapper = function(args) {
            return fn.apply(this, args);
        };
        wrapper.prototype = fn.prototype;
        return new wrapper(getDependencies(fn));
    };
    
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

    this.registerObject = function(name, dependency) {
        dependencies[name] = {type: 'object', value: dependency};
        return this;
    };

    this.defineService = function(name, dependency) {
        dependencies[name] = {type: 'service', value: dependency};
        return this;
    };
    
    this.lookup = function(name) {
        return retrieve(name);
    };
    
    this.invoke = function(target) {
        target.apply(target, getDependencies(target));
    };

    return this;
};

module.exports = InjektorClass;
