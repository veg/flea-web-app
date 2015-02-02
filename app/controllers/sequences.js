import Ember from 'ember';

export default Ember.ObjectController.extend({

  selectedSequences: [],

  rangeStart: 160,
  rangeStop: 200,
  minCoord: 1,
  maxCoord: 800,  // TODO: fix this dynamically

  markPositive: true,

  selectionSaved: function(param) {
    console.log(param);
  }
});
