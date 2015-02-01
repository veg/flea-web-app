
import Ember from 'ember';

/*
example data:

[{name : "gp140",
  values: [
    {x: new Date(), y: 0.1},
    {x: new Date(), y: 0.2},
  ]
 },
 {name: "signal",
  values: [
    {x: new Date(), y: 0.15},
    {x: new Date(), y: 0.12},
  ]
 ]
*/

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  // TODO: make these parameters
  width:  900,
  height: 300,

  margin: {
    top:    20,
    right:  50,
    bottom: 60,
    left:   50
  },

  didInsertElement: function() {
    // TOOD: is this necessary?
    this.set('width', this.$().width());
    this.set('height', this.$().height());
    this._updateChart();
  },

  innerWidth: function() {
    var margin = this.get('margin');
    return this.get('width') - margin.left - margin.right;
  }.property('width', 'margin'),

  innerHeight: function() {
    var margin = this.get('margin');
    return this.get('height') - margin.top - margin.bottom;
  }.property('height', 'margin'),

  innerGroupTransform: function() {
    var margin = this.get('margin');
    return 'translate(%@, %@)'.fmt(margin.left, margin.top);
  }.property('margin'),

  seriesNames: function() {
    var data = this.get('data');
    var names =  data.map(function (d) { return d.name; });
    return names;
  }.property('data'),

  dates: function() {
    var data = this.get('data');
    // TODO: surely there is a better way?
    var result = data.map(function(d) {
      return d.values.map(function(e) {
        return e.x;
      });
    });
    result = d3.set(d3.merge(result)).values();
    return result.map(function(d) {return new Date(d);});
  }.property('data'),

  xDomain: function() {
    return d3.extent(this.get('dates'));
  }.property('dates'),

  xAxisTransform: function() {
    return 'translate(0, %@)'.fmt(this.get('innerHeight'));
  }.property('innerHeight'),

  xScale: function() {
    var domain = this.get('xDomain');
    domain = domain.map(function(d) {return new Date(d);});
    var result = d3.time.scale()
        .domain(domain)
        .range([0, this.get('innerWidth')]);
    return result;
  }.property('innerWidth', 'xDomain'),

  yScale: function() {
    var data = this.get('data');
    var maxValue = d3.max(data, function(d) {
      return d3.max(d.values, function(v) { return v.y; });
    });
    return d3.scale.linear()
      .range([this.get('innerHeight'), 0])
      .domain([0, maxValue]);
  }.property('innerHeight', 'data'),

  d3Line: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');
    return d3.svg.line()
      .x(function(d) { return xScale(d.x); })
      .y(function(d) { return yScale(d.y); })
      .interpolate('linear');
  }.property('xScale', 'yScale'),

  xAxisFormat: function() {
    return d3.time.format('%x');
  }.property(),

  xTickValues: function() {
    return this.get('dates');
  }.property('dates'),

  yAxisFormat: function() {
    return d3.format(".00");
  }.property(),

  colors: function() {
    var colors = d3.scale.category10();
    colors.domain(this.get('seriesNames'));
    return colors;
  }.property('seriesNames'),

  _updateChart: function() {
    var data = this.get('data');
    var line = this.get('d3Line');
    var svg = d3.select('#' + this.get('elementId')).select('.inner');
    var colors = this.get('colors');

    var paths = svg.select('.lines').selectAll('path')
        .data(data, function(d) {return d.name;});

    paths.attr("d", function(d) { return line(d.values); });

    paths.enter()
      .append("path")
      .attr("class", "_evo_line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return colors(d.name); });

    paths.attr("d", function(d) { return line(d.values); });

    paths.exit().remove();
    this._updateLegend();
  },

  onChartChange: function() {
    if (this.state !== 'inDOM') {
      return;
    }
    this._updateChart();
  }.observes('data', 'd3Line', 'seriesNames'),

  // TODO: make legends into seperate component?
  _updateLegend: function() {
    var labels = this.get('seriesNames');
    var colors = this.get('colors');
    var legend_dim = {x: 0, y: 0, spacer: 25, margin: 5, font: 10};
    var svg = d3.select('#' + this.get('elementId')).select('.inner').select('.legend');

    svg.selectAll('g').remove();

    var legend = svg.append("g")
        .attr("class", "_evo_legend")
        .attr("x", legend_dim.x)
        .attr("y", legend_dim.y)
        .attr("transform", "translate("+legend_dim.x+","+legend_dim.y+")");

    legend.selectAll('.legend_panel').remove();

    var legend_parts = legend.selectAll('.legend_panel');
    legend_parts.data(labels)
      .enter()
      .append('g')
      .attr('class', 'legend_panel')
      .each(function(d, i0) {
        console.log(d);
        var g = d3.select(this);
        g.append("rect")
          .attr("x", legend_dim.spacer)
          .attr("y", i0*(legend_dim.spacer + legend_dim.margin))
          .attr("width", legend_dim.spacer)
          .attr("height", legend_dim.spacer)
          .style("fill", function () { return colors(d);});
        g.append("text")
          .attr("x", 2*legend_dim.spacer + legend_dim.font/4)
          .attr("y", (i0+1)*(legend_dim.spacer + legend_dim.margin) - legend_dim.margin
                - (legend_dim.spacer-legend_dim.font)*2/3)
          .style("fill", function () {return colors(d);})
          .text(function (d) {return d;});
      });
  }

});
