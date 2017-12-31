'use strict';

var Injektor = require('../../index.js');
var chores = require('../../lib/chores');
var debugx = require('../../lib/pinbug')('tdd:injektor:suggest:fullname');
var assert = require('chai').assert;
var expect = require('chai').expect;

describe('Suggest fullname:', function() {
  this.timeout(600000);

  it('suggest undefined service/object must be null', function() {
    var injektor = new Injektor({
      isRelativeNameDuplicated: true
    });
    injektor.registerObject('module1/duplicatedName', 'Object1');
    injektor.registerObject('module2/duplicatedName', 'Object2');
    assert.isNull(injektor.suggest('undefinedName'), 'Object1');
  });

  it('suggest unscoped-name should be an empty array', function() {
    var injektor = new Injektor({
      isRelativeNameDuplicated: true
    });
    injektor.registerObject('unscopedName', 'Object1');
    injektor.registerObject('scope/unscopedName', 'Object1');
    assert.deepEqual(injektor.suggest('unscopedName'), []);
  });

  it('suggest duplicated services/objects must be an array', function() {
    var injektor = new Injektor({
      isRelativeNameDuplicated: true
    });
    injektor.registerObject('module1/duplicatedName', 'Object1');
    injektor.registerObject('module2/duplicatedName', 'Object2');
    assert.sameMembers(injektor.suggest('duplicatedName'), [
      'module1/duplicatedName',
      'module2/duplicatedName'
    ]);
  });
});

