import { moduleFor, test } from 'ember-qunit';

import CoordinatesObject from "../../../models/coordinates-object";

moduleFor('controller:session/sequences', 'SequencesController', {
});

var data = [1, 2, 2, 2, 5, 5, 8];

test('it computes single alignment range', function(assert) {
  var controller = this.subject();
  var model = new CoordinatesObject();
  model.set('data', data);
  controller.set('model', {coordinates: model});
  controller.set('ranges', [[0, 2]]);
  var expected = [[0, 4]];
  var result = controller.get('alnRanges');
  assert.deepEqual(result, expected);
});

test('it computes multiple alignment ranges', function(assert) {
  var controller = this.subject();
  var model = new CoordinatesObject();
  model.set('data', data);
  controller.set('model', {coordinates: model});
  controller.set('ranges', [[0, 2], [2, 8]]);
  var expected = [[0, 4], [4, 7]];
  var result = controller.get('alnRanges');
  assert.deepEqual(result, expected);
});
