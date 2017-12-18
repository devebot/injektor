'use strict';

var Injektor = require('../../index.js');
var chores = require('../../lib/chores');
var debugx = require('../../lib/pinbug')('tdd:injektor:invoke_method');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('invoke_method:', function() {
  this.timeout(600000);

  var injektor;

  before(function() {
    injektor = new Injektor();
  });

  it('lookup a service with explicit name annotations', function() {
    injektor
      .defineService('recipe', ['steps', 'object',
        function(p_steps, p_object) {
          p_steps = p_steps || [];
          this.action = function(name) {
            debugx.enabled && debugx('Hello, the instruction of %s is:', name);
            p_steps.forEach(function(step) {
              debugx.enabled && debugx(' - %s the %s', step, p_object);
            });
            return {
              name: name,
              steps: p_steps,
              object: p_object
            };
          };
        }
      ])
      .registerObject('steps', [
        'clean', 'boil', 'peel', 'eat'
      ])
      .registerObject('object', 'Eggs');

    injektor
      .invoke(['recipe', function(p_recipe) {
        var data = p_recipe.action('Peter Pan');
        assert.deepInclude(data, {
          "name": "Peter Pan",
          "steps": [ "clean", "boil", "peel", "eat" ],
          "object": "Eggs"
        });
      }]);
  });

  it('lookup a service with explicit name annotations', function() {
    injektor
      .defineService('recipe', 
        function(steps, object) {
          steps = steps || [];
          this.action = function(name) {
            debugx.enabled && debugx('Hello, the instruction of %s is:', name);
            steps.forEach(function(step) {
              debugx.enabled && debugx(' - %s the %s', step, object);
            });
            return {
              name: name,
              steps: steps,
              object: object
            };
          };
        }
      )
      .registerObject('steps', [
        'clean', 'boil', 'peel', 'eat'
      ])
      .registerObject('object', 'Eggs');

    injektor
      .invoke(function(recipe) {
        var data = recipe.action('Peter Pan');
        assert.deepInclude(data, {
          "name": "Peter Pan",
          "steps": [ "clean", "boil", "peel", "eat" ],
          "object": "Eggs"
        });
      });
  });
});

