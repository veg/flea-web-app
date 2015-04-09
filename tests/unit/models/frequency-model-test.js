import { test, moduleFor } from 'ember-qunit';
import FrequencyObject from "flea-app/models/frequency-object";

moduleFor('model:frequency-object', "FrequencyObject model", {
  beforeEach: function () {},
  afterEach: function () {}
});

test("it exists", function(assert){
  console.log(assert);
  var data = [0, 1, 2, 3];
  var obj = new FrequencyObject();
  obj.data = data;
  assert.ok(obj);
});
