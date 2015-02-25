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

  margin: function() {
    var margin = this.get('_margin');
    var names = this.get('seriesNames');
    if (this.get('legendRight') && (names.length > 0)) {
      var longest = Math.max.apply(null, names.map(function(n) {return n.length;}));
      margin.right = 20 + 10 * longest;
    }
    return margin;
  }.property('seriesNames.[]', 'legendRight'),

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
    var data2 = this.get('data2');
    var names1 =  data.map(function (d) { return d.name; });
    var names2 =  data2.map(function (d) { return d.name; });
    return names1.concat(names2);
  }.property('data.[]', 'data2.[]'),

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
  }.property('data.[]'),

  xDomain: function() {
    return d3.extent(this.get('dates'));
  }.property('dates.[]'),

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

  _yScale: function(data) {
    var maxValue = d3.max(data, function(d) {
      return d3.max(d.values, function(v) { return v.y; });
    });
    var minValue = this.get('ymin');
    if (minValue === null) {
      minValue = d3.min(data, function(d) {
        return d3.min(d.values, function(v) { return v.y; });
      });
    }

    return d3.scale.linear()
      .range([this.get('innerHeight'), 0])
      .domain([minValue, maxValue]);
  },

  yScale: function () {
    return this._yScale(this.get('data'));
  }.property('innerHeight', 'data.[]', 'ymin'),

  yScale2: function () {
    return this._yScale(this.get('data2'));
  }.property('innerHeight', 'data2.[]', 'ymin'),

  yAxisTransform: function() {
    return 'translate(%@, 0)'.fmt(this.get('innerWidth'));
  }.property('innerHeight'),

  d3Line: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');
    return d3.svg.line()
      .x(function(d) { return xScale(d.x); })
      .y(function(d) { return yScale(d.y); })
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale'),

  d3Line2: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale2');
    return d3.svg.line()
      .x(function(d) { return xScale(d.x); })
      .y(function(d) { return yScale(d.y); })
      .interpolate(this.get('interpolation'));
  }.property('xScale', 'yScale2'),

  xAxisFormat: function() {
    return d3.time.format("%B %Y");
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

  _updateData: function(data, line, classname) {
    var svg = d3.select('#' + this.get('elementId')).select('.inner');
    var colors = this.get('colors');

    var paths = svg.select(classname).selectAll('path')
        .data(data, function(d) {return d.name;});

    paths.enter()
      .append("path")
      .attr("class", "timeseries_line");

    paths.attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return colors(d.name); });

    paths.exit().remove();
  },

  _updateChart: function() {
    this._updateData(this.get('data'), this.get('d3Line'), '.lines');
    this._updateData(this.get('data2'), this.get('d3Line2'), '.lines2');
    this._updateLegend();
  },

  onChartChange: function() {
    if (this.state !== 'inDOM') {
      return;
    }
    this._updateChart();
  }.observes('data', 'd3Line', 'seriesNames', 'xScale', 'yScale', 'yScale2'),

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
    legend_parts.data(labels, function(d) {return d;})
      .enter()
      .append('g')
      .attr('class', 'legend_panel')
      .each(function(d, i0) {
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
                - (legend_dim.spacer / 2) + legend_dim.font / 2)
          .style("fill", function () {return colors(d);})
          .attr('font-family', 'monospace')
          .text(function (d) {return d;});
      });
  }

});
