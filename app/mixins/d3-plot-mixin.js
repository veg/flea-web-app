import Ember from 'ember';
import { computed } from 'ember-decorators/object';

export default Ember.Mixin.create({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  // fallback in cause auto resizing fails
  width: 100,
  height: 100,

  margin: {
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

  onChartChange: function() {
    // override this if need to observe more than just data
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateChart');
  }.observes('data.[]'),

  @computed('width', 'margin')
  innerWidth(width, margin) {
    return width - margin.left - margin.right;
  },

  @computed('height', 'margin')
  innerHeight(height, margin) {
    return height - margin.top - margin.bottom;
  },

  @computed('margin')
  innerGroupTransform(margin) {
    return `translate(${margin.left}, ${margin.top})`;
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
