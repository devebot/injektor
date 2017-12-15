'use strict';

var Injektor = require('../index.js');
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
    "document": { 
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "content": {"type": "string" },
        "price": { "type": "number" }
      }
    }
  }
};

injektor
  .defineService('myResource', MyResource)
  .registerObject('fullname', 'Peter Pan')
  .registerObject('document', { 
    type: 'Book',
    content: 'Story about Peter and Wendy',
    price: 17.7
  });

injektor.lookup('myResource').process('open');
