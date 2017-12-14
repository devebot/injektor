'use strict';

var Injektor = require('../../index.js');
var debugx = require('../../lib/tracebug')('tdd:injektor:garbage_collection');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('garbage-collection:', function() {
	this.timeout(600000);

	describe('service is undefined', function() {
		var injektor = null;
		var MyAction = null;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				params = params || {};
				var name = params.name;
				var payload = params.payload;

				this.process = function(action) {
					console.log('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};
			};

			MyAction.argumentSchema = {
				"type": "object",
				"properties": {
					"name": { "type": "string" },
					"payload": { 
						"type": "object",
						"properties": {
							"type": { "type": "string" },
							"content": {"type": "string" },
							"price": { "type": "number" }
						}
					},
					"undefinedService": {
						"type": "object",
						"properties": {}
					}
				}
			};
		});

		it('push exception if service is not defined', function() {
			injektor.defineService('myAction', MyAction)
			.registerObject('name', 'insertDocument')
			.registerObject('payload', { 
				type: 'Book',
				content: 'Story about Peter and Wendy',
				price: 17.7
			});

			var exceptions = [];
			var myAction = injektor.lookup('myAction', exceptions);

			assert.isUndefined(myAction);

			printExceptions(exceptions);

			assert.equal(exceptions.length, 1);
			assert.instanceOf(exceptions[0], Error);
		});
	});

	describe('services are undefined', function() {
		var injektor = null;
		var MyAction = null;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				params = params || {};
				var name = params.name;
				var payload = params.payload;

				this.process = function(action) {
					console.log('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};
			};

			MyAction.argumentSchema = {
				"type": "object",
				"properties": {
					"name": { "type": "string" },
					"payload": { 
						"type": "object",
						"properties": {
							"type": { "type": "string" },
							"content": {"type": "string" },
							"price": { "type": "number" }
						}
					},
					"dependency1": {
						"type": "object",
						"properties": {}
					},
					"dependency2": {
						"type": "object",
						"properties": {}
					}
				}
			};
		});

		it('push exception if service is not defined', function() {
			injektor.defineService('myAction', MyAction)
			.registerObject('name', 'insertDocument')
			.registerObject('payload', { 
				type: 'Book',
				content: 'Story about Peter and Wendy',
				price: 17.7
			});

			var exceptions = [];
			var myAction = injektor.lookup('myAction', exceptions);

			printExceptions(exceptions);

			assert.equal(exceptions.length, 2);
			assert.instanceOf(exceptions[0], Error);
			assert.instanceOf(exceptions[1], Error);
		});
	});

	describe('service constructor is failed', function() {
		var injektor = null;
		var MyAction = null;
		var Parameter1 = null;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				params = params || {};
				var name = params.name;
				var payload = params.payload;

				this.process = function(action) {
					console.log('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};
			};

			MyAction.argumentSchema = {
				"type": "object",
				"properties": {
					"name": { "type": "string" },
					"payload": { 
						"type": "object",
						"properties": {
							"type": { "type": "string" },
							"content": {"type": "string" },
							"price": { "type": "number" }
						}
					},
					"parameter1": {
						"type": "object",
						"properties": {}
					}
				}
			};

			Parameter1 = function(params) {
				var x1 = 100;
				var failed = x1.indexOf(0);
			}

			Parameter1.argumentSchema = {
				"type": "object",
				"properties": {}
			}
		});

		it('push exception if service constructor has failed', function() {
			injektor.defineService('myAction', MyAction)
			.registerObject('name', 'insertDocument')
			.registerObject('payload', { 
				type: 'Book',
				content: 'Story about Peter and Wendy',
				price: 17.7
			})
			.defineService('parameter1', Parameter1);

			var exceptions = [];
			var myAction = injektor.lookup('myAction', exceptions);

			printExceptions(exceptions);

			assert.equal(exceptions.length, 1);
			assert.instanceOf(exceptions[0], Error);
		});
	});

	describe('service constructors are failed', function() {
		var injektor, MyAction, Parameter1, Parameter2;

		before(function() {
			injektor = new Injektor();
			MyAction = function(params) {
				params = params || {};
				var name = params.name;
				var payload = params.payload;

				this.process = function(action) {
					console.log('The developer %s will %s the payload %s', 
						name, action, JSON.stringify(payload));
				};
			};

			MyAction.argumentSchema = {
				"type": "object",
				"properties": {
					"name": { "type": "string" },
					"payload": { 
						"type": "object",
						"properties": {
							"type": { "type": "string" },
							"content": {"type": "string" },
							"price": { "type": "number" }
						}
					},
					"parameter1": {
						"type": "object",
						"properties": {}
					},
					"parameter2": {
						"type": "object",
						"properties": {}
					}
				}
			};

			Parameter1 = function(params) {
				var x1 = 100;
				var failed = x1.indexOf(0);
			}

			Parameter1.argumentSchema = {
				"type": "object",
				"properties": {}
			}

			Parameter2 = function(params) {
				var x2 = 100;
				var failed = require('not-found');
			}

			Parameter2.argumentSchema = {
				"type": "object",
				"properties": {}
			}
		});

		it('push exception if service constructor has failed', function() {
			injektor.defineService('myAction', MyAction)
			.registerObject('name', 'insertDocument')
			.registerObject('payload', { 
				type: 'Book',
				content: 'Story about Peter and Wendy',
				price: 17.7
			})
			.defineService('parameter1', Parameter1)
			.defineService('parameter2', Parameter2);

			var exceptions = [];
			var myAction = injektor.lookup('myAction', exceptions);

			printExceptions(exceptions);

			assert.equal(exceptions.length, 2);
			assert.instanceOf(exceptions[0], Error);
			assert.instanceOf(exceptions[1], Error);
		});
	});
});

var printExceptions = function(exceptions) {
	exceptions = exceptions || [];
	exceptions.forEach(function(err, index) {
		debugx.enabled && debugx('Error#%s', index);
		debugx.enabled && console.log('  name: %s\n  message: "%s"\n  stack: %s',
			err.name, err.message, err.stack);
	});
}
