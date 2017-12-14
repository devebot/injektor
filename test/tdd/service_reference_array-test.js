'use strict';

var Injektor = require('../../index.js');
var debugx = require('../../lib/tracebug')('tdd:injektor:service:reference_array');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');

describe('service_reference_array:', function() {
	this.timeout(600000);

	describe('define services and register objects', function() {
		var injektor, MyAction, Parameter1, Parameter2;

		before(function() {
			injektor = new Injektor();
			MyAction = function(name, payload, p1, p2) {
				this.process = function(action) {
					return util.format('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};

				Object.defineProperty(this, 'state', {
					get: function() {
						return {
							name: name,
							payload: payload,
							parameter1: p1,
							parameter2: p2
						}
					}
				});
			};

			MyAction.referenceArray = ['name', 'payload', 'parameter1', 'parameter2'];

			Parameter1 = function(params) {
				var x1 = 100;
			}

			Parameter1.argumentSchema = {
				"type": "object"
			}

			Parameter2 = function(params) {
				var x2 = 100;
			}

			Parameter2.argumentSchema = {
				"type": "object"
			}
		});

		it('lookup a service with dependencies successfully', function() {
			injektor.defineService('myAction', MyAction)
			.registerObject('name', 'Peter Pan')
			.registerObject('payload', {
				type: 'Book',
				content: 'Story about Peter and Wendy',
				price: 17.7
			})
			.defineService('parameter1', Parameter1)
			.defineService('parameter2', Parameter2);

			var exceptions = [];
			var myAction = injektor.lookup('myAction', exceptions);

			assert.equal(exceptions.length, 0);
			assert.isNotNull(myAction);

			assert.deepInclude(myAction.state, {
				name: 'Peter Pan',
				payload: {
					type: 'Book',
					content: 'Story about Peter and Wendy',
					price: 17.7
				},
				parameter1: {},
				parameter2: {}
			});

			var msg = myAction.process('insertDocument');
			debugx.enabled && debugx('Message: %s', msg);
		});
	});
});

