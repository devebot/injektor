'use strict';

var Injektor = require('../../index.js');
var debugx = require('../../lib/tracebug')('tdd:injektor:service:argument_fields');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');

describe('defineService:', function() {
	this.timeout(600000);

	describe('service_argument_fields', function() {
		var injektor, MyAction, Parameter1, Parameter2;

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

			MyAction.argumentProperties = ['name', 'payload', 'parameter1', 'parameter2'];

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
			injektor
				.defineService('myAction', MyAction)
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

	describe('service_argument_fields_with_scope', function() {
		var injektor, MyAction;
		var TopParameter1, TopParameter2, TopSub1, TopSub2, TopSub3;
		var ChildParameter1, ChildParameter2, ChildSub1, ChildSub2;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				this.injected = params;
			};

			MyAction.argumentProperties = ['name', 'payload', 'parameter1', 'child/parameter2'];

			TopParameter1 = function(params) {
				this.name = "top/parameter1";
				this.argumentProperties = TopParameter1.argumentProperties;
				this.injected = params;
			}
			TopParameter1.argumentProperties = ['sub1', 'child/sub2']

			TopParameter2 = function(params) {
				this.name = "top/parameter2";
				this.argumentProperties = TopParameter2.argumentProperties;
				this.injected = params;
			}
			TopParameter2.argumentProperties = ['child/sub1', 'sub2']

			TopSub1 = function(params) {
				this.name = "top/sub1";
			}
			TopSub1.argumentProperties = [];

			TopSub2 = function(params) {
				this.name = "top/sub2";
			}
			TopSub2.argumentProperties = [];

			TopSub3 = function(params) {
				this.name = "top/sub3";
			}
			TopSub3.argumentProperties = [];

			ChildParameter1 = function(params) {
				this.name = "child/parameter1";
				this.argumentProperties = ChildParameter1.argumentProperties;
				this.injected = params;
			}
			ChildParameter1.argumentProperties = ['top/sub1', 'sub2']

			ChildParameter2 = function(params) {
				this.name = "child/parameter2";
				this.argumentProperties = ChildParameter2.argumentProperties;
				this.injected = params;
			}
			ChildParameter2.argumentProperties = ['sub1', 'top/sub2', 'sub3']

			ChildSub1 = function() {
				this.name = "child/sub1";
			}

			ChildSub2 = function() {
				this.name = "child/sub2";
			}
		});

		it('lookup a service with name resolution using scopes', function() {
			injektor
				.defineService('top/myAction', MyAction)
				.registerObject('name', 'Peter Pan')
				.registerObject('payload', {
					type: 'Book',
					content: 'Story about Peter and Wendy',
					price: 17.7
				})
				.defineService('child/sub1', ChildSub1)
				.defineService('child/sub2', ChildSub2)
				.defineService('child/parameter1', ChildParameter1)
				.defineService('child/parameter2', ChildParameter2)
				.defineService('top/parameter1', TopParameter1)
				.defineService('top/parameter2', TopParameter2)
				.defineService('top/sub1', TopSub1)
				.defineService('top/sub2', TopSub2)
				.defineService('top/sub3', TopSub3);

			var exceptions = [];
			var myAction = injektor.lookup('top/myAction', exceptions);

			assert.equal(exceptions.length, 0);
			assert.isNotNull(myAction);

			debugx.enabled && console.log(JSON.stringify(myAction, null, 4));

			assert.deepInclude(myAction, {
				"injected": {
					"name": "Peter Pan",
					"payload": {
						"type": "Book",
						"content": "Story about Peter and Wendy",
						"price": 17.7
					},
					"parameter1": {
						"name": "top/parameter1",
						"argumentProperties": [
							"sub1",
							"child/sub2"
						],
						"injected": {
							"sub1": {
								"name": "top/sub1"
							},
							"child/sub2": {
								"name": "child/sub2"
							}
						}
					},
					"child/parameter2": {
						"name": "child/parameter2",
						"argumentProperties": [
							"sub1",
							"top/sub2",
							"sub3"
						],
						"injected": {
							"sub1": {
								"name": "child/sub1"
							},
							"top/sub2": {
								"name": "top/sub2"
							},
							"sub3": {
								"name": "top/sub3"
							}
						}
					}
				}
			});
		});
	});
});
