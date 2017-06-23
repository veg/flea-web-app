import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'g',
  classNames: ['legend'],

  xCoord: 0,
  yCoord: 0,

  legendLabels: [],
  legendColors: null,

  didInsertElement: function() {
    this._updateLegend();
  },

  onChartChange: function() {
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateLegend');
  }.observes('legendLabels.[]', 'legendColors'),

  _updateLegend: function() {
    var labels = this.get('legendLabels');
    var colors = this.get('legendColors');

    var xval = this.get('xCoord');
    var yval = this.get('yCoord');
    var spacer = 25;
    var font = 10;
    var legend_dim = {x: xval, y: yval, spacer: spacer, margin: 5, font: font};
    var svg = d3.select('#' + this.get('elementId'))

    svg.selectAll('g').remove();

    var legend = svg.append("g")
        .attr("class", "d3_legend")
        .attr("x", legend_dim.x)
        .attr("y", legend_dim.y)
        .attr("transform", "translate("+legend_dim.x+","+legend_dim.y+")");

    var legend_parts = legend.selectAll('.legend_panel');
    legend_parts.data(labels, d => d)
      .enter()
      .append('g')
      .attr('class', 'legend_panel')
      .each(function(d, idx) {
        var g = d3.select(this);
        g.append("rect")
          .attr("x", legend_dim.spacer)
          .attr("y", idx*(legend_dim.spacer + legend_dim.margin))
          .attr("width", legend_dim.spacer)
          .attr("height", legend_dim.spacer)
          .style("fill", () => colors(d));
        g.append("text")
          .attr("x", 2*legend_dim.spacer + legend_dim.font/4)
          .attr("y", (idx+1)*(legend_dim.spacer + legend_dim.margin) - legend_dim.margin - (legend_dim.spacer / 2) + legend_dim.font / 2)
          .style("fill", () => colors(d))
          .attr('font-family', 'monospace')
          .text(d => d);
      });
  },
});
