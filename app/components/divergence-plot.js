import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  width:  900,
  height: 300,

  margin: {
    top:    20,
    right:  50,
    bottom: 60,
    left:   50
  },

  didInsertElement: function() {
    this.set('width', this.$().width());
    this.set('height', this.$().height());
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

  dates: function() {
    var data = this.get('data');
    return data.map (function(d) { return d[0]; });
  }.property('data'),

  xDomain: function() {
    return d3.extent(this.get('dates'));
  }.property('dates'),

  xAxisTransform: function() {
    return 'translate(0, %@)'.fmt(this.get('innerHeight'));
  }.property('innerHeight'),

  xScale: function() {
    return d3.time.scale()
      .range([0, this.get('innerWidth')])
      .domain(this.get('xDomain'));
  }.property('innerWidth', 'xDomain'),

  yScale: function() {
    var data        = this.get('data'),
        maxValue    = data ? d3.max(data, function(d){ return d[1]; }) : 0;

    return d3.scale.linear()
      .range([this.get('innerHeight'), 0])
      .domain([0, maxValue]);
  }.property('innerHeight', 'data'),

  d3Line: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');
    return d3.svg.line()
      .x(function(d) { return xScale(d[0]); })
      .y(function(d) { return yScale(d[1]); })
      .interpolate('linear');
  }.property('xScale', 'yScale'),

  lineData: function() {
    if (!this.get('data')) {
      return 'M0,0';
    }
    return this.get('d3Line')(this.get('data')) || 'M0,0';
  }.property('data', 'd3Line'),

  xAxisFormat: function() {
    return d3.time.format('%x');
  }.property(),

  xTickValues: function() {
    return this.get('dates');
  }.property('dates'),

  yAxisFormat: function() {
    return d3.format(".00");
  }.property(),

});


// export default Ember.Component.extend({
//   tagName: 'svg',
//   attributeBindings: 'width height'.w(),
//   margin: {top: 20, right: 50, bottom: 60, left: 50},

//   draw: function(){

//     // TODO: can we get rid of template and do everything here?

//     // TODO: make these dynamic
//     var keys = ["ds_divergence", "dn_divergence"];
//     var labels = ["dS divergence", "dN divergence"];
//     var segment = this.get('region');

//     console.log(segment);

//     var formatPercent = d3.format(".0%");
//     var width = this.get('w');
//     var height = this.get('h');
//     var data = this.get('data');
//     var svg = d3.select('#' + this.get('elementId'));
//     var x = d3.time.scale().range([0, width]);
//     var y = d3.scale.linear().range([height, 0]);
//     var xAxis = d3.svg.axis().scale(x).orient("bottom");
//     var yAxis = d3.svg.axis().scale(y).orient("left");

//     var divergence_data = prepare_data_from_keys(data, segment, keys);

//     var x_dates = divergence_data.map (function(d,i) { return d[0]; });
//     x_dates.sort();
//     x.domain(d3.extent(x_dates));
//     xAxis.tickValues (x_dates);

//     var overall_max = d3.max(divergence_data, function(d) { return d3.max(d.slice(1)); });
//     y.domain([0, overall_max]);

//     svg.select(".axis.x").call(xAxis)
//       .selectAll ("text")
//       .style("text-anchor", "start")
//       .attr ("transform", "rotate(45)")
//       .attr("dx","0.5em")
//       .attr("dy","0.5em");

//     svg.select(".axis.y").call(yAxis);

//     var svg_lines = svg.select(".lines");

//     var line = d3.svg.line()
//         .x(function(d,i) { return x(d.x); })
//         .y(function(d) { return y(d.y); });

//     var colors = d3.scale.category10();
//     var up_to = keys.length;
//     for (var k = 0; k < up_to; k++) {
//       svg_lines.append("path")
//         .datum(divergence_data.map (function (d) {return {'x' : d[0], 'y': d[1+k]};}))
//         .attr("class", "_evo_line")
//         .style('stroke', colors(k))
//         .style('fill', 'none')
//         .attr("d", line);
//     }

//     var legend_dim = {x: 50, y:20, spacer:25, margin:5, font: 12};
//     var legend = svg.select(".legend")
//         .attr("class", "_evo_legend")
//         .attr("x", legend_dim.x)
//         .attr("y", legend_dim.y)
//         .attr("transform", "translate(" + legend_dim.x + "," + legend_dim.y + ")");
//     legend.selectAll('g').data(labels)
//       .enter()
//       .append('g')
//       .each(function(d, i0) {
//         var g = d3.select(this);
//         g.append("rect")
//           .attr("x", legend_dim.spacer)
//           .attr("y", i0*(legend_dim.spacer + legend_dim.margin))
//           .attr("width", legend_dim.spacer)
//           .attr("height", legend_dim.spacer)
//           .style("fill", function () { return colors(i0); });

//         g.append("text")
//           .attr("x", 2*legend_dim.spacer + legend_dim.font/4)
//           .attr("y", (i0+1)*(legend_dim.spacer + legend_dim.margin) - legend_dim.margin - (legend_dim.spacer-legend_dim.font)*2/3)
//           .style("fill", function () {return colors(i0);})
//           .text(function (d) {return d;});
//       });
//   },

//   didInsertElement: function(){
//     this.draw();
//   }
// });


