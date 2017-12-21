'use strict';

var Injektor = require('../../index.js');
var chores = require('../../lib/chores');
var debugx = require('../../lib/pinbug')('tdd:injektor:cycle:detection');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('Dependency cycle detection:', function() {
  this.timeout(600000);

  it('detect dependency cycle and throws an exception', function() {
    var injektor = new Injektor();
    
    var S1 = function(params) {
      this.injected = params;
    };
    S1.referenceArray = ['name', 'payload', 's2', 's3', 's4'];
    injektor.defineService('s1', S1);

    var S2 = function(params) {
      this.injected = params;
    };
    S2.referenceArray = ['record', 's3'];
    injektor.defineService('s2', S2);

    var S3 = function(params) {
      this.injected = params;
    };
    S3.referenceArray = ['s1', 's4'];
    injektor.defineService('s3', S3);

    var S4 = function(params) {
      this.injected = params;
    };
    S4.referenceArray = [];
    injektor.defineService('s4', S4);

    injektor
      .registerObject('name', 'Dependency cycle detection')
      .registerObject('payload', { error: true, reason: 'dependency cycle detected' })
      .registerObject('record', { percent: 77 });

    var errMsg = 'dependency cycle detected for "s2" at 3 and 0 in ["s2","s3","s1","s2"]';

    assert.throws(function() {
      var s2 = injektor.lookup('s2');
    }, Injektor.errors.DependencyCycleDetectedError, errMsg);
  });
});

