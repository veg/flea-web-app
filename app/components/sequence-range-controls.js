import Ember from 'ember';

export default Ember.Component.extend({
  
  // bound to controller
  rangeStart: 1,
  rangeStop: 1,
  markPositive: false,

  // updated from template
  minCoord: 1,
  maxCoord: 1,

  actions: {
    moveRange: function(offset) {
      // FIXME: why are these sometimes strings???
      var start = +this.get('rangeStart');
      var stop = +this.get('rangeStop');
      this.set('rangeStart', start + offset);
      this.set('rangeStop', stop + offset);
    }
  }
});
