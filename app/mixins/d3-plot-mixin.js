import Ember from 'ember';

export default Ember.Mixin.create({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  width: 1200,
  height: 800,

  margin: {
    top:    5,
    right:  5,
    bottom: 5,
    left:   5,
  },

  data: null,

  didInsertElement: function() {
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

  innerWidth: function() {
    let margin = this.get('margin');
    let width = this.get('width');
    return width - margin.left - margin.right;
  }.property('width', 'margin'),

  innerHeight: function() {
    let margin = this.get('margin');
    let height = this.get('height');
    return height - margin.top - margin.bottom;
  }.property('height', 'margin'),

  innerGroupTransform: function() {
    let margin = this.get('margin');
    return `translate(${margin.left}, ${margin.top})`;
  }.property('margin'),

  xAxisTransform: function() {
    let height = this.get('innerHeight');
    return `translate(0, ${height})`;
  }.property('innerHeight'),

  yAxisTransform: function() {
    let width = this.get('innerWidth');
    return `translate(${width}, 0)`;
  }.property('innerWidth'),

});
