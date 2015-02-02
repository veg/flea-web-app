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
  },

  moveRange: function(offset) {
    var start = this.get('rangeStart');
    var stop = this.get('rangeStop');
    var minCoord = this.get('minCoord');
    var maxCoord = this.get('maxCoord');
    this.set('rangeStart', setInRange(start + offset,
                                      minCoord,
                                      maxCoord));
    this.set('rangeStart', setInRange(stop + offset,
                                      minCoord,
                                      maxCoord));
  },

  moveLeft: function() {
    this.moveRange(-1);
  },

  moveRight: function() {
    this.moveRange(1);
  },

  jumpLeft: function() {
    this.moveRange(-5);
  },

  jumpRight: function() {
    this.moveRange(5);
  },

});


function setInRange(i, minval, maxval) {
  return Math.min(Math.max(i, minval), maxval);
}
