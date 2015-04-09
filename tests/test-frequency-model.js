import { test, moduleForModel } from 'ember-qunit';
import FrequencyObject from "flea-app/models/frequency-object";

moduleFor('model:frequency-object', "Unit test for models/frequency-object", {
  beforeEach: function () {},
  afterEach: function () {}
});

test("it exists", function(assert){
  data = [0, 1, 2, 3];
  var obj = new FrequencyObject();
  obj.data = data;
  assert.ok(obj);
});
