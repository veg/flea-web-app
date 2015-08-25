import Ember from 'ember';
import {oneIndex} from '../utils/utils';

export default Ember.Component.extend({
  tagName: '',

  // updated from template
  validRange: [0, 1],

  rangeText: '',

  computedText: function() {
    var ranges = this.get('ranges');
    return ranges.map(range => oneIndex(range[0]) + "-" + range[1]).join(';');
  }.property('ranges', 'ranges.length', 'ranges.[]', 'ranges.[].[]'),

  updateText: function() {
    this.set('rangeText', this.get('computedText'));
  }.observes('computedText').on('init'),

  toController: function(ranges) {
    var [vstart, vstop] = this.get('validRange');
    ranges = ranges.map(function(range) {
      var [start, stop] = range;
      if (start < vstart) {
        start = vstart;
      }
      if (stop > vstop) {
        stop = vstop;
      }
      return [start, stop];
    });

    if (_.all(ranges.map(range => range[0] < range[1]))) {
      this.sendAction('setRanges', ranges);
    }
  },

  actions: {
    moveRanges: function(offset) {
      // FIXME: why are these sometimes strings???
      var ranges = this.get('ranges');
      var [vstart, vstop] = this.get('validRange');
      for (let r=0; r<ranges.length; r++) {
        var [start, stop] = ranges[r];
        if ((vstart <= start + offset) &&
          (start + offset <= stop + offset) &&
          (stop + offset <= vstop)) {
          ranges[r][0] = start + offset;
          ranges[r][1] = stop + offset;
        }
      }
      this.toController(ranges);
    },

    setRange: function(start, stop) {
      var ranges = [[start, stop]];
      this.toController(ranges);
    },

    handleTextSubmit: function() {
      var text = this.get('rangeText');
      try {
        var ranges = text.split(';').map(function(a) {
          var parts = a.split('-');
          if (parts.length !== 2) {
            throw "wrong number of ranges";
          }
          return [(+parts[0]) - 1, +parts[1]];
        });
        this.toController(ranges);
      } catch (err) {
        // TODO: notify user of failed parse
      }
    }
  }
});
