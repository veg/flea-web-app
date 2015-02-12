import Ember from 'ember';

// input: (first is used for brushable navigation)
// - names ['name1', 'name2', ...]
// - data1 [[values], [values], ...]
// - data2 (may be empty)
// - positions - posns to mark (may be empty) [[posns], [posns], ...]
// - labels ['label1'] or ['label1', 'label2']

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],
  
  width:  850,
  heightEach: 80,

  margin: {
    top:    20,
    right:  0,
    bottom: 50,
    left:   30
  },

  height: function() {
    var margin = this.get('margin');
    return margin.top + margin.bottom + this.get('names.length') * this.get('heightEach');
  }.property('heightEach', 'margin', 'names.length'),


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

  onChartChange: function() {
    if (this.state !== 'inDOM') {
      return;
    }
    this._updateChart();
  }.observes('names@each', 'data1@each', 'data2@each', 'positions@each', 'labels@each',
             'width', 'height', 'heightEach', 'margin', 'yMax'),
  
  yMax: function() {
    var data1 = this.get('data1');
    var data2 = this.get('data2');
    return [d3.max(_.flatten(data1)), d3.max(_.flatten(data2))];
  }.property('data1@each', 'data2@each'),

  _updateChart: function() {
    var names = this.get('names');
    var data1 = this.get('data1');
    var data2 = this.get('data2');
    var positions = this.get('positions');
    var labels = this.get('labels');
    
    var width = this.get('innerWidth');
    var height = this.get('innerHeight');
    var height_each = this.get('heightEach');

    // FIXME: use innerGroupTransform, so margin should be unnecessary here
    var margin = this.get('margin');

    var n_sites = data1[0].length;

    // TODO: make self-contained
    function brushed() {
      x.domain(brush.empty() ? x_overall.domain() : brush.extent());
      for (var k = 0; k < focus_plots.length; k++) {
        focus_plots[k].select("._pos_dS").attr("d", area_objects[k][0]);
        if (two_d) {
          focus_plots[k].select("._pos_dN").attr("d", area_objects[k][1]);
        }
        focus_plots[k].selectAll(".selected_site").
          attr ("cx", function (d) {return x(d);});
      }
      svg.select(".pos.x.axis").call(xAxis);
    }
    
    var svg = d3.select('#' + this.get('elementId')).select('.inner');
    
    svg.selectAll("path").remove();
    svg.selectAll("g").remove();   
    svg.selectAll("defs").remove();   
    
    svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height); 
    
    svg = svg.append("g");
    
    var x = d3.scale.linear()
        .range([0, width])
        .domain([1, n_sites]);
    
    var x_overall = d3.scale.linear()
        .range([0, width])
        .domain([1, n_sites]);
    
    var brush = d3.svg.brush()
        .x(x_overall)
        .on("brush", brushed);    
    
    var two_d = data2.length > 0;
    
    var ymax = this.get('yMax');
    var y = d3.scale.linear()
        .range([height_each, 0])
        .domain([two_d ? -ymax[1] : 0, ymax[0]]);
  
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    
    var xAxis_overall = d3.svg.axis()
        .scale(x_overall)
        .orient("top");
    
    var focus_plots  = [];  
    var area_objects = [];
    
    for (var plot_id = 0; plot_id < names.length; plot_id++) {
      var plot_svg = svg.append ("g")
          .attr("transform", "translate(0," + (height_each * plot_id) + ")");
      var local_areas = [];
      local_areas[0] = d3.svg.area()
        .x(function(d,i) { return x(i+1); })
        .y0(function() {  return y(0); })
        .y1(function(d) {  return y(d); })
        .interpolate('step');
      
      if (two_d) {    
        local_areas[1] = d3.svg.area()
          .x(function(d,i) { return x(i+1); })
          .y0(function(d) {  return y(-d); })
          .y1(function() {  return y(0); })
          .interpolate('step');
      }
      
      area_objects.push(local_areas);
      
      plot_svg.append ("text")
        .attr("transform", "translate(0," + y(0) + ") rotate (-90)")
        .attr("y", "0")
        .attr("dy", "-0.5em")
        .style("text-anchor", two_d ? "middle" : "start")
        .text(names[plot_id]);
      plot_svg.append("path")
        .datum(data1[plot_id])
        .attr("class", "_pos_dS")
        .attr("clip-path", "url(#clip)")
        .attr("d", local_areas[0]);
      if (two_d) {
        plot_svg.append("path")
          .datum(data2[plot_id])
          .attr("clip-path", "url(#clip)")
          .attr("class", "_pos_dN")
          .attr("d", local_areas[1]);
      }
      if (plot_id === 0) {
        plot_svg.append("g")
          .attr("class", "x brush")
          .call(brush)
          .selectAll("rect")
          .attr("y", -6)
          .attr("height", height_each + 7);
      } else {
        focus_plots.push (plot_svg);
      }
      if (positions.length > 0) {
        plot_svg.selectAll (".selected_site")
          .data(positions[plot_id])
          .enter()
          .append("circle")
          .attr ("cx", function (d) {return x(d);})
          .attr ("cy", function () {return y(0);})
          .attr ("r", 4)
          .attr ("class", "selected_site")
          .append("title")
          .text (function (d) { return "Codon " + d; });
      }
    }
    
    svg.append("g")
      .attr("class", "pos x_overall axis")
      .call(xAxis_overall)
      .append("text")
      .attr("transform", "translate(0,0)")
      .attr("dy", "-.4em")
      .attr("dx", ".25em")
      .style("text-anchor", "start")
      .text("Site");    
    
    svg.append("g")
      .attr("class", "pos x axis")
      .attr("transform", "translate(0," + (height) + ")")
      .call(xAxis)
      .append("text")
      .attr("transform", "translate(0,0)")
      .attr("dy", "+1.1em")
      .attr("dx", ".25em")
      .style("text-anchor", "start")
      .text("Site");    
    
    if (labels.length > 0) {
      var legend_dim = {x: 20, y:height + margin.top + margin.bottom/3, spacer:15, margin:5, font: 10, x_step : 100};
      var me_colors = ['#2E66FF', '#FFB314'];
      var legend = svg.append("g")
          .attr("class", "_evo_legend")
          .attr("x", legend_dim.x)
          .attr("y", legend_dim.y)
          .attr("transform", "translate("+legend_dim.x+","+legend_dim.y+")");
      legend.selectAll('g').data(labels)
        .enter()
        .append('g')
        .each(function(d, i) {
          var g = d3.select(this);
          g.append("rect")
            .attr("y", legend_dim.spacer)
            .attr("x", i*(legend_dim.spacer + legend_dim.margin + legend_dim.x_step))
            .attr("width", legend_dim.spacer)
            .attr("height", legend_dim.spacer)
            .style("fill", me_colors[i]);
          g.append("text")
            .attr("y", 2*legend_dim.spacer)
            .attr("x", i*(legend_dim.spacer + legend_dim.margin + legend_dim.x_step) + legend_dim.spacer + legend_dim.font/4)
            .style("fill", me_colors[i])
            .text(function (d) {return d;});
        });
    }
  }
});

