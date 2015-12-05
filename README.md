injektor
========

With injektor (and almost of dependency injection libraries), one can manage the service objects in a common "place" called **container** and doesn't care to assign the dependent parameters to a service when it is invoked.

## How to use

Install injektor module:

```
$ npm install --save injektor
```

In your program, create the container:

```javascript
var Injektor = require('injektor');
var injektor = new Injektor();
```

Register a object or define a service with some dependencies:

```javascript
injektor.registerObject('greeting', {
    greet: function() { return 'Hello world!'; }
});

injektor.defineService('service1', function(fullname) {
    var self = fullname;
    this.sayHello = function(name) {
      console.log('Hello ' + name + ". I'm " + self)
    }; 
}).registerObject('fullname', 'Computer');

injektor.defineService('service2', function() { 
    this.sayWellcome = function(name) {
      console.log('Wellcome to ' + name)
   }; 
});

```

Use the lookup() method to get services or invoke() method to evaluate the services:


```javascript
injektor.lookup('service1').sayHello('Ubuntu');

injektor.invoke(function (greeting, service1, service2) {
    console.log(greeting.greet())
    console.log('\n');
    service1.sayHello('Injektor');
    service2.sayWellcome('Vietnam');
});
```
