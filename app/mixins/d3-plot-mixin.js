import Ember from 'ember';
import { once } from "@ember/runloop"
import { computed, observes } from 'ember-decorators/object';

export default Ember.Mixin.create({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  // fallback in cause auto resizing fails
  width: 100,
  height: 100,

  margins: {
    top:    5,
    right:  5,
    bottom: 5,
    left:   5,
  },

  data: null,

  didInsertElement: function() {
    this._super(...arguments);
    this._updateChart();
  },

  _updateChart: function() {
    // override this
  },

  @observes('data.[]')
  onChartChange: function() {
    // override this if need to observe more than just data
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateChart');
  },

  @computed('width', 'margins')
  innerWidth(width, margins) {
    return width - margins.left - margins.right;
  },

  @computed('height', 'margins')
  innerHeight(height, margins) {
    return height - margins.top - margins.bottom;
  },

  @computed('margins')
  innerGroupTransform(margins) {
    return `translate(${margins.left}, ${margins.top})`;
  },

  @computed('innerHeight')
  xAxisTransform(height) {
    return `translate(0, ${height})`;
  },

  @computed('innerWidth')
  yAxisTransform(width) {
    return `translate(${width}, 0)`;
  }

});
