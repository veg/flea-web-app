import Ember from 'ember';
import D3Plot from "flea-app/mixins/d3-plot-mixin";

export default Ember.Component.extend(D3Plot, {
  copynumbers: null,
  seqIdToNodeName: null,
  seqIdToNodeColor: null,
  seqIdToMotifColor: null,
  seqIdToMotif: null,

  domain: function(name) {
    return d3.extent(this.get('data').map(d => d[name]));
  },

  xDomain: function() {
    return this.domain('x');
  }.property('data.[]'),

  yDomain: function() {
    return this.domain('y');
  }.property('data.[]'),

  cnDomain: function() {
    let cns = this.get('copynumbers');
    return [0, d3.max(_.values(cns))];
  }.property('copynumbers.[]'),

  scale: function(name, minval, maxval) {
    return d3.scale.linear()
      .domain(this.get(name))
      .range([minval, maxval]);
    return result;
  },

  xScale: function() {
    return this.scale('xDomain', 0, this.get('innerWidth'));
  }.property('innerWidth', 'xDomain'),

  yScale: function() {
    return this.scale('yDomain', 0, this.get('innerHeight'));
  }.property('innerWidth', 'xDomain'),

  cnScale: function() {
    return d3.scale.linear()
      .domain(this.get('cnDomain'))
      .range([1, 500]);
    return result;
  }.property('cnDomain'),

  onChartChange: function() {
    // override this if need to observe more than just data
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateChart');
  }.observes('data.[]', 'seqIdToNodeName', 'xScale', 'yScale', 'cnScale', 'copynumbers.[]'),

  _updateChart: function() {
    let svg = d3.select('#' + this.get('elementId')).select('.inner');
    let data = this.get('data');
    let xScale = this.get('xScale');
    let yScale = this.get('yScale');
    let cnScale = this.get('cnScale');
    let cns = this.get('copynumbers');
    let seqIdToNodeName = this.get('seqIdToNodeName');
    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function(d) {
	return xScale(d.x);
      })
      .attr("cy", function(d) {
	return yScale(d.y);
      })
      .attr("r", function(d) {
	return Math.sqrt(cnScale(cns[d.name]));
      });

    svg.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .text(function(d) {
	return seqIdToNodeName[d.name];
      })
      .attr("x", function(d) {
	return xScale(d.x);
      })
      .attr("y", function(d) {
	return yScale(d.y);
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "11px")
      .attr("fill", "black");
  },
});
