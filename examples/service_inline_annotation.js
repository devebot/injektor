'use strict';

var Injektor = require('../index.js');
var injektor = new Injektor();

injektor
  .defineService('myResource', ['fullname', 'document',
    function(name, doc) {
      this.process = function(action) {
        console.log('The developer %s will %s the document %s',
            name, action, JSON.stringify(doc));
      };
    }
  ])
  .registerObject('fullname', 'Peter Pan')
  .registerObject('document', {
    type: 'Book',
    content: 'Story about Peter and Wendy',
    price: 17.7
  });

injektor.lookup('myResource').process('open');
