import Ember from 'ember';

export default Ember.Component.extend({
  tagName:    'g',
  classNames: ['axis'],

  attributeBindings: ['transform'],

  scale:       null,
  orient:      'bottom',
  ticks:       10,
  tickValues:  null,
  tickSize:    15,
  tickFormat:  null,
  tickPadding: 15,
  rotate:      0,

  d3Axis: function() {
    return d3.svg.axis()
      .scale(this.get('scale'))
      .orient(this.get('orient'))
      .ticks(this.get('ticks'))
      .tickValues(this.get('tickValues'))
      .tickSize(this.get('tickSize'))
      .tickFormat(this.get('tickFormat'))
      .tickPadding(this.get('tickPadding'));
  }.property('scale', 'orient', 'ticks', 'tickValues', 'tickSize',
             'tickFormat', 'tickPadding'),

  didInsertElement: function() {
    this._updateAxis();
  },

  onD3AxisChange: function() {
    if (this.state !== 'inDOM') {
      return;
    }

    this._updateAxis();
  }.observes('d3Axis', 'rotate'),

  _updateAxis: function() {
    var result = d3.select(this.$()[0]).call(this.get('d3Axis'));
    // TODO: is this the best place to do this?
    var rotate = this.get('rotate');
    if (rotate !== 0) {
        result.selectAll ("text")
        .style("text-anchor", "start")
        .attr ("transform", "rotate(" + rotate + ")")
        .attr("dx","0.5em")
        .attr("dy","0.5em");
    }
  }
});
