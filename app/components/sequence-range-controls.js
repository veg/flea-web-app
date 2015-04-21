import Ember from 'ember';
import {oneIndex} from '../utils/utils';

export default Ember.Component.extend({

  tagName: '',

  // bound to controller; 0-indexed
  ranges: [],

  // updated from template
  seqLen: 1,

  myRanges: [],
  rangeText: '',

  fromController: function() {
    this.updateFromController();
  }.on('didInsertElement'),

  updateFromController: function() {
    this.set('myRanges', this.get('ranges'));
    this.makeText();
  }.observes('ranges'),

  makeText: function() {
    var ranges = this.get('myRanges');
    var text = ranges.map(range => oneIndex(range[0]) + "-" + range[1]).join(';');
    this.set('rangeText', text);
  },

  parseText: function () {
    var text = this.get('rangeText');
    var ranges = text.split(';').map(function(a) {
      var parts = a.split('-');
      if (parts.length !== 2) {
        throw "wrong number of ranges";
      }
      return [(+parts[0]) - 1, +parts[1]];
    });
    this.set('myRanges', ranges);
  },

  toController: function() {
    var ranges = this.get('myRanges');

    var seqLen = +this.get('seqLen');

    ranges = ranges.map(function(range) {
      var start = range[0];
      var stop = range[1];
      if (start < 0) {
        start = 0;
      }
      if (stop > seqLen) {
        stop = seqLen;
      }
      return [start, stop];
    });
    this.set('myRanges', ranges);

    if (_.all(ranges.map(range => range[0] < range[1]))) {
      this.set('ranges', ranges);
      this.set('myRanges', ranges);
    }
  },

  actions: {
    moveRanges: function(offset) {
      // FIXME: why are these sometimes strings???
      var ranges = this.get('ranges');
      var seqLen = this.get('seqLen');
      for (var r=0; r<ranges.length; r++) {
        var start = ranges[r][0];
        var stop = ranges[r][1];
        if ((0 <= start + offset) &&
          (start + offset <= stop + offset) &&
          (stop + offset <= seqLen)) {
          ranges[r][0] = start + offset;
          ranges[r][1] = stop + offset;
        }
      }
      this.set('myRanges', ranges);
      this.toController();
    },

    setRange: function(start, stop) {
      this.set('myRanges', [[start, stop]]);
      this.makeText();
      this.toController();
    },

    display: function() {
      this.parseText();
      this.toController();
    }
  }
});
