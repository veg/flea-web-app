import Ember from 'ember';

import { computed, observes, action } from 'ember-decorators/object';
import { on } from 'ember-decorators/object/evented';
import { PropTypes } from 'ember-prop-types';

import {oneIndex} from 'flea-web-app/utils/utils';

export default Ember.Component.extend({

   propTypes: {
      validRange: PropTypes.array,
      rangeText: PropTypes.string,
   },

  getDefaultProps() {
    return {
      validRange: [],
      rangeText: '',
    };
  },

  tagName: '',
  inputClass: "input-valid",

  @computed('ranges', 'ranges.length', 'ranges.[]', 'ranges.[].[]')
  computedText(ranges) {
    return ranges.map(range => oneIndex(range[0]) + "-" + range[1]).join(';');
  },

  @on('init')
  @observes('computedText')
  updateText() {
    this.set('rangeText', this.get('computedText'));
  },

  toController(ranges) {
    let [vstart, vstop] = this.get('validRange');
    ranges = ranges.map(function(range) {
      let [start, stop] = range;
      if (start < vstart) {
        start = vstart;
      }
      if (stop > vstop) {
        stop = vstop;
      }
      return [start, stop];
    });

    if (R.all(R.map(range => range[0] < range[1], ranges))) {
      this.sendAction('setRanges', ranges);
    }
  },

  @action
  moveRanges(offset) {
    // FIXME: why are these sometimes strings???
    let ranges = this.get('ranges');
    let [vstart, vstop] = this.get('validRange');
    for (let r=0; r<ranges.length; r++) {
      let [start, stop] = ranges[r];
      if ((vstart <= start + offset) &&
          (start + offset <= stop + offset) &&
          (stop + offset <= vstop)) {
        ranges[r][0] = start + offset;
        ranges[r][1] = stop + offset;
      }
    }
    this.toController(ranges);
  },

  @action
  setRange(start, stop) {
    let ranges = [[start, stop]];
    this.toController(ranges);
  },

  @action
  handleTextSubmit() {
    this.set('inputClass', 'input-valid');
    let text = this.get('rangeText');
    try {
      let ranges = text.split(';').map(function(a) {
        let parts = a.split('-');
        if (parts.length !== 2) {
          throw "wrong number of ranges";
        }
        return [(+parts[0]) - 1, +parts[1]];
      });
      this.toController(ranges);
    } catch (err) {
      this.set('inputClass', 'input-invalid');
    }
  }
});
