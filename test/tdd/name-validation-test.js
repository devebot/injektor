'use strict';

var Injektor = require('../../index.js');
var chores = require('../../lib/chores');
var debugx = require('../../lib/pinbug')('tdd:injektor:name:validation');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('Name validation:', function() {
  this.timeout(600000);

  it('the first character must be a alphabet letter', function() {
    var injektor = new Injektor();
    var codeOfa = 'a'.charCodeAt(0);
    var codeOfA = 'A'.charCodeAt(0);
    for(var i=0; i<26; i++) {
      injektor.registerObject(String.fromCharCode(codeOfa + i) + 'Name', codeOfa + i);
      injektor.registerObject(String.fromCharCode(codeOfA + i) + 'Name', codeOfA + i);
    }

    for(var j=0; j<10; j++) {
      assert.throws(function() {
        injektor.registerObject(j + 'Name', 'The first character is a digit character');
      }, Error, 'dependency name does not match the pattern');
    }

    ['-invalid', '_invalid', '/invalid', ':invalid'].forEach(function(name) {
      assert.throws(function() {
        injektor.registerObject(name, 'This is invalid name');
      }, Error, 'dependency name does not match the pattern');
    });
  });

  it('accept "-" and "_" characters', function() {
    var injektor = new Injektor();
    var name = 'a-bcd-efg_Service';
    injektor.registerObject(name, 17779);
    assert.equal(17779, injektor.lookup(name));
  });

  describe('provide scopes in both name and context', function() {
    var injektor;
    var checkOutput = function(p1, p2, p3) {
      var params = {name: p1, action: p2, data: p3};
      assert.deepEqual(params, {
        "name": "Devebot Injektor",
        "action": "lookup",
        "data": {
          "message": "This data has no scope"
        }
      });
    };
    beforeEach(function() {
      injektor = new Injektor();
      injektor.registerObject('myscope/name', 'Devebot Injektor');
      injektor.registerObject('action', 'lookup', { scope: 'myscope' });
      injektor.registerObject('data', {
        message: 'This data has no scope'
      });
    });

    it('case#1', function() {
      injektor.invoke(['name', 'action', 'data', checkOutput]);
    });

    it('case#2', function() {
      injektor.invoke(['myscope/name', 'myscope/action', 'data', checkOutput]);
    });

    it('case#3', function() {
      injektor.invoke(['name', 'myscope/action', 'data', checkOutput]);
    });

    it('case#4', function() {
      injektor.invoke(['myscope/name', 'action', 'data', checkOutput]);
    });
  });

  it('does not allow duplicate relative name by default', function() {
    var injektor = new Injektor();
    injektor.registerObject('module1/duplicatedName', 'Object1');
    injektor.registerObject('module2/duplicatedName', 'Object2');
    assert.throws(function() {
      injektor.lookup('duplicatedName');
    }, Injektor.errors.DuplicatedRelativeNameError,
        'name [duplicatedName] is duplicated');
  });

  it('set isRelativeNameDuplicated to allow duplicate relative name', function() {
    var injektor = new Injektor({
      isRelativeNameDuplicated: true
    });
    injektor.registerObject('module1/duplicatedName', 'Object1');
    injektor.registerObject('module2/duplicatedName', 'Object2');
    assert.equal(injektor.lookup('duplicatedName'), 'Object1');
  });
});

