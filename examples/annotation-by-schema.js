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

