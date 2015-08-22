import { moduleFor, test } from 'ember-qunit';

import FrequencyObject from "../../../models/frequency-object";

moduleFor('controller:session/sequences', 'SequencesController', {
});

var data = {1 : {HXB2: 1},
            2: {HXB2: 2},
            3: {HXB2: 2},
            4: {HXB2: 2},
            5: {HXB2: 5},
            6: {HXB2: 5},
            7: {HXB2: 8}
           };

test('it computes single alignment range', function(assert) {
  var controller = this.subject();
  var model = new FrequencyObject();
  model.set('data', data);
  controller.set('model', {frequencies: model});
  controller.set('ranges', [[0, 2]]);
  var expected = [[0, 4]];
  var result = controller.get('alnRanges');
  assert.deepEqual(result, expected);
});

test('it computes multiple alignment ranges', function(assert) {
  var controller = this.subject();
  var model = new FrequencyObject();
  model.set('data', data);
  controller.set('model', {frequencies: model});
  controller.set('ranges', [[0, 2], [2, 8]]);
  var expected = [[0, 4], [4, 7]];
  var result = controller.get('alnRanges');
  assert.deepEqual(result, expected);
});
