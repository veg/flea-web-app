import Ember from 'ember';
import D3Plot from "flea-app/mixins/d3-plot-mixin";
import WidthMixin from "flea-app/mixins/width-mixin";

export default Ember.Component.extend(D3Plot, WidthMixin, {
  copynumbers: null,
  nameToNodeLabel: null,
  nameToNodeColor: null,
  nameToMotifColor: null,
  nameToMotif: null,

  legendLabels: [],
  legendColors: null,

  width: 100,

  height: function() {
    // adjust height so that axes are equal
    let xDomain = this.get('xDomain');
    let yDomain = this.get('yDomain');
    let width = this.get('width');

    let xmin = xDomain[0];
    let xmax = xDomain[1];
    let ymin = yDomain[0];
    let ymax = yDomain[1];

    let ratio = (ymax - ymin) / (xmax - xmin);
    return width * ratio;
  }.property('width', 'xDomain', 'yDomain'),

  xDomain: function() {
    return d3.extent(this.get('data').map(d => d.x));
  }.property('data.[]'),

  yDomain: function() {
    return d3.extent(this.get('data').map(d => d.y));
  }.property('data.[]'),

  scale: function(domain, minval, maxval) {
    return d3.scale.linear()
      .domain(this.get(domain))
      .range([minval, maxval]);
  },

  xScale: function() {
    return this.scale('xDomain', 0, this.get('innerWidth'));
  }.property('innerWidth', 'xDomain'),

  yScale: function() {
    return this.scale('yDomain', this.get('innerHeight'), 0);
  }.property('innerHeight', 'yDomain'),

  cnDomain: function() {
    let cns = this.get('copynumbers');
    return [0, d3.max(_.values(cns))];
  }.property('copynumbers.[]'),

  margin: function () {
    let cn = this.get('cnDomain')[1];
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
  }.property('cnDomain'),

  onChartChange: function() {
    // override this if need to observe more than just data
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateChart');
  }.observes('data.[]', 'nameToNodeColor', 'nameToMotif', 'nameToMotifColor',
	     'xScale', 'yScale', 'cnScale',
	     'copynumbers.[]', 'highlightedNodes'),

  _updateChart: function() {
    let svg = d3.select('#' + this.get('elementId')).select('.inner').select('.circles');
    let data = this.get('data');
    let xScale = this.get('xScale');
    let yScale = this.get('yScale');
    let cnScale = this.get('cnScale');
    let cns = this.get('copynumbers');
    let nameToNodeColor = this.get('nameToNodeColor');
    let nameToMotif = this.get('nameToMotif');
    let nameToMotifColor = this.get('nameToMotifColor');
    let highlightedNodes = this.get('highlightedNodes');

    let circles = svg.selectAll("circle").data(data, function(d) {return d.name;});

    d3.select("body").select(".tooltip").remove();
    let div = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

    circles.enter()
      .append("circle");

    circles.exit().remove();

    circles
      .attr("cx", function(d) {
	return xScale(d.x);
      })
      .attr("cy", function(d) {
	return yScale(d.y);
      })
      .attr("r", function(d) {
	return 1.5 * Math.sqrt(cnScale(cns[d.name]));
      })
      .style("fill", function(d) {
	return nameToNodeColor[d.name];
      }).style("opacity", function(d) {
	if (highlightedNodes.length === 0) {
	  return 1.0;
	}
	if (highlightedNodes.has(d.name)) {
	  return 1.0;
	} else {
	  return 0.1;
	}
      })
      .on("mouseover", function(d) {
	let html = d.name;
	let color = 'black';
	if (nameToMotif[d.name]) {
	  html += ' : ' + nameToMotif[d.name];
	  color = nameToMotifColor[d.name];
	}
        div.transition()
          .duration(100)
          .style("opacity", 0.9);
        div.html(html)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
	  .style('color', color);
      })
      .on("mouseout", function() {
        div.transition()
          .duration(100)
          .style("opacity", 0);
      });
  },
});
