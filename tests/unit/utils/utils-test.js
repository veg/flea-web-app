import { test } from 'ember-qunit';
import { refToAlnCoords, alignmentTicks, zeroIndex } from 'flea-web-app/utils/utils';


test("it computes alignmentTicks", function(assert){
  var data = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13];
  var a2r = data.map(c => zeroIndex(c));
  var stop = 14;
  var r2a = refToAlnCoords(a2r, stop)[0];
  var tick = 5;
  var result = alignmentTicks(a2r, r2a, tick);
  var expected = [0, 3, 8, 10];
  assert.deepEqual(result, expected);
  assert.equal(a2r[result[0]], zeroIndex(2));
  assert.equal(a2r[result[1]], zeroIndex(5));
  assert.equal(a2r[result[2]], zeroIndex(11));
  assert.equal(a2r[result[3]], zeroIndex(13));
});
