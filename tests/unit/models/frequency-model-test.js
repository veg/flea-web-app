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

test("it computes alnToRefCoords", function(){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 1, 1, 1, 4, 4, 7];
  var result = model.get('alnToRefCoords');
  deepEqual(result, expected);
});

test("it computes refToFirstAlnCoords", function(){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 1, 4, 4, 4, 6, 6, 6];
  deepEqual(model.get('refToFirstAlnCoords'), expected);
});

test("it computes refToLastAlnCoords", function(){
  var model = this.subject();
  model.set('data', data);
  var expected = [0, 3, 3, 3, 5, 5, 5, 6];
  deepEqual(model.get('refToLastAlnCoords'), expected);
});
