'use strict';

var Injektor = require('../index.js');
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
  ]).registerObject('object', 'Eggs');

injektor.lookup('recipe').action('Peter Pan');
