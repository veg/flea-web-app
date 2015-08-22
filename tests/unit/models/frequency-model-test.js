import { test, moduleFor } from 'ember-qunit';

moduleFor('model:frequency-object', "FrequencyObject model", {
  beforeEach: function () {},
  afterEach: function () {}
});

var data = {1 : {HXB2: 1},
            2: {HXB2: 2},
            3: {HXB2: 2},
            4: {HXB2: 2},
            5: {HXB2: 5},
            6: {HXB2: 5},
            7: {HXB2: 8}
           };

var data2 = {1 : {HXB2: 3},
            2: {HXB2: 4},
            3: {HXB2: 4},
            4: {HXB2: 4},
            5: {HXB2: 7},
            6: {HXB2: 7},
            7: {HXB2: 10}
           };

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
