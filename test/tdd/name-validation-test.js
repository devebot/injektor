'use strict';

var Injektor = require('../../index.js');
var chores = require('../../lib/chores');
var debugx = require('../../lib/pinbug')('tdd:injektor:name:validation');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('Name validation:', function() {
  this.timeout(600000);

  var injektor;

  beforeEach(function() {
    injektor = new Injektor();
  });

  it('the first character must be a alphabet letter', function() {
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
    var name = 'a-bcd-efg_Service';
    injektor.registerObject(name, 17779);
    assert.equal(17779, injektor.lookup(name));
  });
});

