import Ember from 'ember';

export default Ember.Component.extend({

  // bound to controller
  rangeStart: 1,
  rangeStop: 1,

  // updated from template
  minCoord: 1,
  maxCoord: 1,

  // TODO: this kind of validation and syncing with controller
  // must be common. Look for more idiomatic way to do it.
  myRangeStart: 1,
  myRangeStop: 1,

  fromController: function() {
    this.set('myRangeStart', +this.get('rangeStart'));
    this.set('myRangeStop', +this.get('rangeStop'));
  }.on('didInsertElement'),

  toController: function() {
    var mystart = +this.get('myRangeStart');
    var mystop = +this.get('myRangeStop');

    var minCoord = +this.get('minCoord');
    var maxCoord = +this.get('maxCoord');

    if (mystart < minCoord) {
      mystart = this.set('myRangeStart', minCoord);
    }

    if (mystop > maxCoord) {
      this.set('myRangeStop', maxCoord);
      mystop = maxCoord;
    }

    if ((minCoord <= mystart) && (mystart <= mystop) && (mystop <= maxCoord)) {
      this.set('rangeStart', +mystart);
      this.set('rangeStop', +mystop);
      this.set('myRangeStart', +mystart);
      this.set('myRangeStop', +mystop);
    }
  },

  actions: {
    moveRange: function(offset) {
      // FIXME: why are these sometimes strings???
      var start = +this.get('rangeStart');
      var stop = +this.get('rangeStop');
      if ((this.get('minCoord') <= start + offset) &&
          (start + offset <= stop + offset) &&
          (stop + offset <= this.get('maxCoord'))) {
        this.set('myRangeStart', start + offset);
        this.set('myRangeStop', stop + offset);
        this.toController();
      }
    },
    display: function() {
      this.toController();
    }
  }
});
