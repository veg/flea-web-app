import Ember from 'ember';
import { once } from "@ember/runloop"
import { observes } from 'ember-decorators/object';

export default Ember.Component.extend({
  tagName: 'g',
  classNames: ['legend'],

  xCoord: 0,
  yCoord: 0,

  legendLabels: [],
  legendColors: null,

  didInsertElement() {
    this._super(...arguments);
    this._updateLegend();
  },

  @observes('legendLabels.[]', 'legendColors')
  onChartChange() {
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateLegend');
  },

  _updateLegend() {
    let labels = this.get('legendLabels');
    let colors = this.get('legendColors');

    let xval = this.get('xCoord');
    let yval = this.get('yCoord');
    let spacer = 25;
    let font = 10;
    let legend_dim = {x: xval, y: yval, spacer: spacer, margin: 5, font: font};
    let svg = d3.select('#' + this.get('elementId'));

    svg.selectAll('g').remove();

    let legend = svg.append("g")
        .attr("class", "d3_legend")
        .attr("x", legend_dim.x)
        .attr("y", legend_dim.y)
        .attr("transform", "translate("+legend_dim.x+","+legend_dim.y+")");

    let legend_parts = legend.selectAll('.legend_panel');
    legend_parts.data(labels, d => d)
      .enter()
      .append('g')
      .attr('class', 'legend_panel')
      .each(function(d, idx) {
        let g = d3.select(this);
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
