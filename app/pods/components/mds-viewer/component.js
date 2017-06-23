import Ember from 'ember';
import D3Plot from "flea-app/mixins/d3-plot-mixin";

export default Ember.Component.extend(D3Plot, {
  copynumbers: null,
  seqIdToNodeName: null,
  seqIdToNodeColor: null,
  seqIdToMotifColor: null,
  seqIdToMotif: null,

  width: 800,
  height: 800,

  xyDomain: function() {
    let xDomain = d3.extent(this.get('data').map(d => d.x));
    let yDomain = d3.extent(this.get('data').map(d => d.y));
    return [d3.min([xDomain[0], yDomain[0]]),
	    d3.max([xDomain[1], yDomain[1]])];
  }.property('data.[]'),

  scale: function(maxval) {
    let name = 'xyDomain';
    let minval = 0;
    return d3.scale.linear()
      .domain(this.get(name))
      .range([minval, maxval]);
  },

  xScale: function() {
    return this.scale(this.get('innerWidth'));
  }.property('innerWidth', 'xyDomain'),

  yScale: function() {
    return this.scale(this.get('innerHeight'));
  }.property('innerWidth', 'xyDomain'),

  cnDomain: function() {
    let cns = this.get('copynumbers');
    return [0, d3.max(_.values(cns))];
  }.property('copynumbers.[]'),

  margin: function () {
    let cn = this.get('cnDomain')[1]
    let scale = this.get('cnScale');
    let radius = Math.sqrt(scale(cn));
    return {
      top:    radius,
      right:  radius,
      bottom: radius,
      left:   radius,
    };
  }.property('cnDomain'),

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
    console.log(seqIdToNodeName)
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
  },
});
