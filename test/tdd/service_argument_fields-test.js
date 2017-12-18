'use strict';

var Injektor = require('../../index.js');
var debugx = require('../../lib/pinbug')('tdd:injektor:service:argument_fields');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');

describe('defineService:', function() {
	this.timeout(600000);

	describe('service_argument_fields', function() {
		var injektor, MyAction, First1, First2;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				params = params || {};
				var name = params.name;
				var payload = params.payload;

				this.process = function(action) {
					return util.format('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};

				Object.defineProperty(this, 'state', {
					get: function() {
						return params
					}
				});
			};

			MyAction.argumentProperties = ['name', 'payload', 'first1', 'first2'];

			First1 = function(params) {
				var x1 = 100;
			}

			First1.argumentSchema = {
				"type": "object"
			}

			First2 = function(params) {
				var x2 = 100;
			}

			First2.argumentSchema = {
				"type": "object"
			}
		});

		it('lookup a service with dependencies successfully', function() {
			injektor
				.defineService('myAction', MyAction)
				.registerObject('name', 'Peter Pan')
				.registerObject('payload', {
					type: 'Book',
					content: 'Story about Peter and Wendy',
					price: 17.7
				})
				.defineService('first1', First1)
				.defineService('first2', First2);

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
				first1: {},
				first2: {}
			});

			var msg = myAction.process('insertDocument');
			debugx.enabled && debugx('Message: %s', msg);
		});
	});

	describe('service_argument_fields_with_scope', function() {
		var injektor, MyAction, expectedAction;
		var FooFirst1, FooFirst2, FooSecond1, FooSecond2, FooSecond3;
		var BarFirst1, BarFirst2, BarSecond1, BarSecond2;

		beforeEach(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				this.injected = params;
			};

			MyAction.argumentProperties = ['name', 'payload', 'first1', 'bar/first2'];

			FooFirst1 = function(params) {
				this.name = "foo/first1";
				this.argumentProperties = FooFirst1.argumentProperties;
				this.injected = params;
			}
			FooFirst1.argumentProperties = ['second1', 'bar/second2']

			FooFirst2 = function(params) {
				this.name = "foo/first2";
				this.argumentProperties = FooFirst2.argumentProperties;
				this.injected = params;
			}
			FooFirst2.argumentProperties = ['bar/second1', 'second2']

			FooSecond1 = function(params) {
				this.name = "foo/second1";
			}
			FooSecond1.argumentProperties = [];

			FooSecond2 = function(params) {
				this.name = "foo/second2";
			}
			FooSecond2.argumentProperties = [];

			FooSecond3 = function(params) {
				this.name = "foo/second3";
			}
			FooSecond3.argumentProperties = [];

			BarFirst1 = function(params) {
				this.name = "bar/first1";
				this.argumentProperties = BarFirst1.argumentProperties;
				this.injected = params;
			}
			BarFirst1.argumentProperties = ['foo/second1', 'second2']

			BarFirst2 = function(params) {
				this.name = "bar/first2";
				this.argumentProperties = BarFirst2.argumentProperties;
				this.injected = params;
			}
			BarFirst2.argumentProperties = ['second1', 'foo/second2', 'second3']

			BarSecond1 = function() {
				this.name = "bar/second1";
			}

			BarSecond2 = function() {
				this.name = "bar/second2";
			}

			expectedAction = {
				"injected": {
					"name": "Peter Pan",
					"payload": {
						"type": "Book",
						"content": "Story about Peter and Wendy",
						"price": 17.7
					},
					"first1": {
						"name": "foo/first1",
						"argumentProperties": [
							"second1",
							"bar/second2"
						],
						"injected": {
							"second1": {
								"name": "foo/second1"
							},
							"bar/second2": {
								"name": "bar/second2"
							}
						}
					},
					"bar/first2": {
						"name": "bar/first2",
						"argumentProperties": [
							"second1",
							"foo/second2",
							"second3"
						],
						"injected": {
							"second1": {
								"name": "bar/second1"
							},
							"foo/second2": {
								"name": "foo/second2"
							},
							"second3": {
								"name": "foo/second3"
							}
						}
					}
				}
			}

			injektor
				.registerObject('name', 'Peter Pan')
				.registerObject('payload', {
					type: 'Book',
					content: 'Story about Peter and Wendy',
					price: 17.7
				})
				.defineService('bar/second1', BarSecond1)
				.defineService('bar/second2', BarSecond2)
				.defineService('bar/first1', BarFirst1)
				.defineService('bar/first2', BarFirst2)
				.defineService('foo/first1', FooFirst1)
				.defineService('foo/first2', FooFirst2)
				.defineService('foo/second1', FooSecond1)
				.defineService('foo/second2', FooSecond2)
				.defineService('foo/second3', FooSecond3);
		});

		it('lookup a service with name resolution using scopes', function() {
			injektor.defineService('foo/myAction', MyAction);

			var exceptions = [];
			var myAction = injektor.lookup('foo/myAction', exceptions);
			debugx.enabled && console.log(JSON.stringify(myAction, null, 4));

			assert.equal(exceptions.length, 0);
			assert.isNotNull(myAction);
			assert.deepInclude(myAction, expectedAction);
		});
	});
});
