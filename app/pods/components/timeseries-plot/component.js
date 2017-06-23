import Ember from 'ember';
import {mapIfPresent} from "flea-app/utils/utils";
import D3Plot from "flea-app/mixins/d3-plot-mixin";

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

export default Ember.Component.extend(D3Plot, {
  width:  900,
  height: 300,

  interpolation: "linear",

  ymin: null,
  data: [],
  data2: [],

  userColors: null,
  tickMap: {},

  margin: {
    top:    20,
    right:  50,
    bottom: 60,
    left:   50
  },

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

  d3Line: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale', 'interpolation'),

  d3Line2: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale2');
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale2', 'interpolation'),

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
    var names = this.get('seriesNames');
    if (names.length <= 10) {
      colors = d3.scale.category10();
    } else {
      colors = d3.scale.category20();
    }
    colors.domain(names);
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
             'd3Line', 'd3Line2',
	     'xScale', 'yScale', 'yScale2'),
});
