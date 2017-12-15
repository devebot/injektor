# injektor

[![NPM](https://nodei.co/npm/injektor.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/injektor/)

With injektor (and almost of dependency injection libraries), one can manage the service objects in a common "place" called **container** and doesn't care to assign the dependent parameters to a service when it is invoked.

## Usage

Install injektor module:

```shell
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
      console.log('Hello ' + name + ". I'm " + self);
    }; 
}).registerObject('fullname', 'Computer');

injektor.defineService('service2', function() { 
    this.sayWellcome = function(name) {
      console.log('Wellcome to ' + name);
   }; 
});

```

Use the lookup() method to get services or invoke() method to evaluate the services:


```javascript
injektor.lookup('service1').sayHello('Ubuntu');

injektor.invoke(function (greeting, service1, service2) {
    console.log(greeting.greet());
    console.log('\n');
    service1.sayHello('Injektor');
    service2.sayWellcome('Vietnam');
});
```

The Console should display the text below:

```
Hello world!
Hello Injektor. I'm Computer
Wellcome to Vietnam
```

## Dependency Annotations

### Object schema annotation

```javascript
var Injektor = require('injektor');
var injektor = new Injektor();

var MyResource = function(params) {
  params = params || {};
  var fullname = params.fullname;
  var document = params.document;
  
  this.process = function(action) {
    console.log('The developer %s will %s the document %s', 
        fullname, action, JSON.stringify(document));
  };
};

MyResource.argumentSchema = {
  "type": "object",
  "properties": {
    "fullname": { "type": "string" },
    "document": { "type": "object" }
  }
};

injektor.defineService('myResource', MyResource)
    .registerObject('fullname', 'Peter Pan')
    .registerObject('document', { 
      type: 'Book',
      content: 'Peter and Wendy'
    });

injektor.lookup('myResource').process('open');
```

The Console will display the text: 'The developer Peter Pan will open the document {"type":"Book","content":"Peter and Wendy"}'.

### Explicit name annotation

```javascript
var Injektor = require('injektor');
var injektor = new Injektor();

injektor
  .defineService('recipe', ['steps', 'object',
    function(steps, object) {
      steps = steps || [];
      this.action = function(name) {
        console.log('Hello, the instruction of %s is:', name);
        steps.forEach(function(step) {
          console.log(' - %s the %s', step, object);
        });
      };
    }
  ])
  .registerObject('steps', [
    'clean', 'boil', 'peel', 'eat'
  ])
  .registerObject('object', 'Eggs');

injektor
  .invoke(['recipe', function(rp) {
    rp.action('Peter Pan');
  }]);
```

### Implicit name annotation

```javascript
var Injektor = require('injektor');
var injektor = new Injektor();

injektor
  .defineService('recipe', function(steps, object) {
    steps = steps || [];
    this.action = function(name) {
      console.log('Hello, the instruction of %s is:', name);
      steps.forEach(function(step) {
        console.log(' - %s the %s', step, object);
      });
    };
  });

injektor
  .registerObject('steps', [
    'clean', 'boil', 'peel', 'eat'
  ])
  .registerObject('object', 'Eggs');

injektor.lookup('recipe').action('Peter Pan');
```
