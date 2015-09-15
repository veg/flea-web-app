import { test, moduleFor } from 'ember-qunit';

moduleFor('model:coordinates-object', "CoordinatesObject model", {
  beforeEach: function () {},
  afterEach: function () {}
});

var data = [1, 2, 2, 2, 5, 5, 8];

var data2 = [3, 4, 4, 4, 7, 7, 10];

test("it computes alnToRefCoords", function(assert){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 1, 1, 1, 4, 4, 7];
  var result = model.get('alnToRefCoords');
  assert.deepEqual(result, expected);
});

test("it computes refToFirstAlnCoords", function(assert){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 1, 4, 4, 4, 6, 6, 6];
  assert.deepEqual(model.get('refToFirstAlnCoords'), expected);
});

test("it computes refToLastAlnCoords", function(assert){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 3, 3, 3, 5, 5, 5, 6];
  assert.deepEqual(model.get('refToLastAlnCoords'), expected);
});

test("it computes alnToRefCoords with shifted range", function(assert){
  var model = this.subject();
  model.set('data', data2);
  var expected = [2, 3, 3, 3, 6, 6, 9];
  var result = model.get('alnToRefCoords');
  assert.deepEqual(result, expected);
});

test("it computes refToFirstAlnCoords with shifted range", function(assert){
  var model = this.subject();
  model.set('data', data2);
  var expected = [undefined, undefined, 0, 1, 4, 4, 4, 6, 6, 6];
  assert.deepEqual(model.get('refToFirstAlnCoords'), expected);
});

test("it computes refToLastAlnCoords with shifted range", function(assert){
  var model = this.subject();
  model.set('data', data2);
  var expected = [undefined, undefined, 0, 3, 3, 3, 5, 5, 5, 6];
  assert.deepEqual(model.get('refToLastAlnCoords'), expected);
});
