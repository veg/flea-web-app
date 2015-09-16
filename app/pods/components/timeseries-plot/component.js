import Ember from 'ember';
import {mapIfPresent} from "flea-app/utils/utils";

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
 }
]
*/

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  width:  900,
  height: 300,

  legendRight: false,
  interpolation: "linear",

  ymin: null,
  data: [],
  data2: [],

  _margin: {
    top:    20,
    right:  50,
    bottom: 60,
    left:   50},

  userColors: null,
  tickMap: {},

  margin: function() {
    var margin = this.get('_margin');
    var names = this.get('seriesNames');
    if (this.get('legendRight') && (names.length > 0)) {
      var longest = Math.max.apply(null, names.map(n => n.length));
      margin.right = 20 + 10 * longest;
    }
    return margin;
  }.property('seriesNames.[]', 'legendRight'),

  didInsertElement: function() {
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
    var data2 = this.get('data2');
    var names1 = data.map(d => d.name);
    var names2 = data2.map(d => d.name);
    return names1.concat(names2);
  }.property('data.[].name', 'data2.[].name'),

  dates: function() {
    var data = this.get('data');
    // TODO: surely there is a better way?
    var result = data.map(d => d.values.map(e => e.x));
    result = d3.set(d3.merge(result)).values();
    result = result.map(d => new Date(d));
    return result;
  }.property('data.[].values.[].x'),

  xDomain: function() {
    return d3.extent(this.get('dates'));
  }.property('dates.[]'),

  xAxisTransform: function() {
    return 'translate(0, %@)'.fmt(this.get('innerHeight'));
  }.property('innerHeight'),

  xScale: function() {
    var domain = this.get('xDomain');
    domain = domain.map(d => new Date(d));
    var result = d3.time.scale()
        .domain(domain)
        .range([0, this.get('innerWidth')]);
    return result;
  }.property('innerWidth', 'xDomain'),

  _yScale: function(data) {
    var maxValue = d3.max(data, d => d3.max(d.values, v => v.y));
    var minValue = this.get('ymin');
    if (minValue === null) {
      minValue = d3.min(data, d => d3.min(d.values, v => v.y));
    }
    if (minValue === maxValue) {
      maxValue += 1;
      minValue = Math.max(0, minValue - 1);
    }
    return d3.scale.linear()
      .range([this.get('innerHeight'), 0])
      .domain([minValue, maxValue]);
  },

  yScale: function () {
    return this._yScale(this.get('data'));
  }.property('innerHeight', 'data.[].values.[].y', 'ymin'),

  yScale2: function () {
    return this._yScale(this.get('data2'));
  }.property('innerHeight', 'data2.[].values.[].y', 'ymin'),

  yAxisTransform: function() {
    return 'translate(%@, 0)'.fmt(this.get('innerWidth'));
  }.property('innerHeight'),

  d3Line: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale'),

  d3Line2: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale2');
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale2'),

  xAxisFormat: function() {
    var map = this.get('tickMap');
    return (d => mapIfPresent(map, d));
  }.property('tickMap'),

  xTickValues: function() {
    return this.get('dates');
  }.property('dates'),

  yAxisFormat: function() {
    return d3.format(".00");
  }.property(),

  colors: function() {
    var colors = this.get('userColors');
    if (colors !== null) {
      return colors;
    }
    colors = d3.scale.category10();
    colors.domain(this.get('seriesNames'));
    return colors;
  }.property('userColors', 'seriesNames'),

  _updateData: function(data, line, classname) {
    var svg = d3.select('#' + this.get('elementId')).select('.inner');
    var colors = this.get('colors');

    var paths = svg.select(classname).selectAll('path')
        .data(data, d => d.name);

    paths.enter()
      .append("path")
      .attr("class", "timeseries_line");

    paths.attr("d", d => line(d.values))
      .style("stroke", d => colors(d.name));

    paths.exit().remove();
  },

  _updateChart: function() {
    this._updateData(this.get('data'), this.get('d3Line'), '.lines');
    this._updateData(this.get('data2'), this.get('d3Line2'), '.lines2');
    this._updateLegend();
  },

  onChartChange: function() {
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateChart');
  }.observes('data.[].name',
             'data.[].values.[].x',
             'data.[].values.[].y',
             'data2.[].name',
             'data2.[].values.[].x',
             'data2.[].values.[].y',
             'seriesNames', 'd3Line', 'd3Line2', 'xScale', 'yScale', 'yScale2'),

  // TODO: make legends into seperate component?
  _updateLegend: function() {
    var labels = this.get('seriesNames');
    var colors = this.get('colors');

    var xval = 0;
    var spacer = 25;
    var font = 10;
    if (this.get('legendRight')) {
      // FIXME: this is way too brittle
      xval = this.get('innerWidth');
      spacer = 10;
      font = 6;
    }
    var legend_dim = {x: xval, y: 0, spacer: spacer, margin: 5, font: font};
    var svg = d3.select('#' + this.get('elementId')).select('.inner').select('.legend');

    // TODO: do not remove everything
    svg.selectAll('g').remove();

    var legend = svg.append("g")
        .attr("class", "timeseries_legend")
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
  }

});
