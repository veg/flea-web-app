import Ember from 'ember';
import {oneIndex, alignmentTicks} from 'flea-app/utils/utils';

// input: (first is used for brushable navigation)
// - names ['name1', 'name2', ...]
// - data1 [[values], [values], ...]
// - data2 (may be empty)
// - positions - posns to mark (may be empty) [[posns], [posns], ...]
// - labels ['label1'] or ['label1', 'label2']
// refToFirstAlnCoords
// alnToRefCoords


export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  tick: 100,

  // if false, use first data element as a combined view
  addCombined: true,

  //TODO: make it possible to fit width of container
  width:  850,
  heightEach: 80,
  labelHeight: 25,

  margin: {
    top:    20,
    right:  20,
    bottom: 50,
    left:   30
  },

  height: function() {
    var margin = this.get('margin');
    return margin.top + margin.bottom + this.get('nPlots') * this.get('heightEach') + this.get('labelHeight');
  }.property('heightEach', 'margin', 'nPlots', 'labelHeight'),

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
    // FIXME: this gets called multiple times
    if (this._state !== 'inDOM') {
      return;
    }
    Ember.run.once(this, '_updateChart');
  }.observes('names.[]', 'data1', 'data2', 'positions',
             'labels.[]', 'width', 'height', 'heightEach', 'margin', 'yMax',
             'labelHeight', 'addCombined'),

  yMax: function() {
    var data1 = this.get('data1');
    var data2 = this.get('data2');
    return [d3.max(_.flatten(data1)), d3.max(_.flatten(data2))];
  }.property('data1', 'data2'),

  nPlots: function() {
    var result = this.get('names.length');
    if (this.get('addCombined')) {
      result += 1;
    }
    return result;
  }.property('names.length', 'addCombined'),

  _updateChart: function() {
    try {
      this.__updateChart();
    } catch (err) {
      if (err && err.name && err.name === "data consistency error") {
        this._removeAll();
        // TODO: do more than just hide the plots.
      } else {
        throw err;
      }
    }
  },

  _removeAll: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.inner');

    svg.selectAll("path").remove();
    svg.selectAll("g").remove();
    svg.selectAll("defs").remove();
  },

  __updateChart: function() {
    var names = this.get('names');
    var data1 = this.get('data1');
    var data2 = this.get('data2');
    var positions = this.get('positions');
    var labels = this.get('labels');

    // assume all arrays have same length
    var n_sites = data1[0].length;
    var n_plots = this.get('nPlots');
    var two_d = data2.length > 0;

    if (this.get('addCombined') && names[0] !== "Combined") {
      var zeros = [];
      for (let i=0; i < n_sites; i++) {
        zeros.push(0);
      }
      data1 = addFront(zeros, data1);
      if (two_d) {
        data1 = addFront(zeros, data2);
      }
      if (positions.length > 0) {
        positions = addFront([], positions);
      }
      names = addFront("Combined", names);
    }

    // check data consistency
    if (two_d && data1.length !== data2.length) {
      throw {
        name: "data consistency error",
        message: "data1 and data2 have different lengths"
      };
    }
    if (data1.length !== names.length) {
      throw {
        name: "data consistency error",
        message: "data1 and names have different lengths"
      };
    }
    for (let j=0; j<n_plots; j++) {
      if (data1[j].length !== n_sites) {
        throw {
          name: "data consistency error",
          message: "data vector lengths are inconsistent"
        };
      }
      if (two_d) {
        if (data2[j].length !== n_sites) {
          throw {
            name: "data consistency error",
            message: "data vector lengths are inconsistent"
          };
        }
      }
    }

    var width = this.get('innerWidth');
    var height = this.get('innerHeight');
    var height_each = this.get('heightEach');

    // necessary for clip path url
    // FIXME: there must be a more ember-friendly way to do this
    var url = this.get('url');

    var make_cx = function (d) {return x(d);};

    function brushed() {
      x.domain(brush.empty() ? x_overall.domain() : brush.extent());
      for (let k = 0; k < focus_plots.length; k++) {
        focus_plots[k].select("._pos_dS").attr("d", area_objects[k][0]);
        if (two_d) {
          focus_plots[k].select("._pos_dN").attr("d", area_objects[k][1]);
        }
        focus_plots[k].selectAll(".selected_site").
          attr ("cx", make_cx);
      }
      svg.select(".pos.x.axis").call(xAxis);
    }

    this._removeAll();
    var svg = d3.select('#' + this.get('elementId')).select('.inner');

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

    var ymax = this.get('yMax');
    var y = d3.scale.linear()
        .range([height_each, 0])
        .domain([two_d ? -ymax[1] : 0, ymax[0]]);

    var r2a = this.get('refToFirstAlnCoords');
    var a2r = this.get('alnToRefCoords');
    var tick = this.get('tick');
    var ticks = alignmentTicks(a2r, r2a, tick);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));

    var xAxis_overall = d3.svg.axis()
        .scale(x_overall)
        .orient("top")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));

    var focus_plots  = [];
    var area_objects = [];

    for (let plot_id = 0; plot_id < names.length; plot_id++) {
      var plot_svg = svg.append ("g")
          .attr("transform", "translate(0," + (height_each * plot_id) + ")");
      var local_areas = [];
      local_areas[0] = d3.svg.area()
        .x((d,i) => x(i+1))
        .y0(() => y(0))
        .y1(d => y(d))
        .interpolate('step');

      if (two_d) {
        local_areas[1] = d3.svg.area()
          .x((d,i) =>x(i+1))
          .y0(d => y(-d))
          .y1(() => y(0))
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
        .attr("clip-path", "url(" + url + "#clip)")
        .attr("d", local_areas[0]);
      if (two_d) {
        plot_svg.append("path")
          .datum(data2[plot_id])
          .attr("clip-path", "url(" + url + "#clip)")
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
      if (plot_id < positions.length) {
        plot_svg.selectAll (".selected_site")
          .data(positions[plot_id])
          .enter()
          .append("circle")
          .attr ("cx", d => x(d))
          .attr ("cy", () => y(0))
          .attr ("r", 4)
          .attr ("class", "selected_site")
          .attr("clip-path", "url(" + url + "#clip)")
          .append("title")
          .text (d => "Codon " + d);
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

    var labelHeight = this.get('labelHeight');

    svg.append("g")
      .attr("class", "pos x axis")
      .attr("transform", "translate(0," + (height - labelHeight) + ")")
      .call(xAxis)
      .append("text")
      .attr("transform", "translate(0,0)")
      .attr("dy", "+1.1em")
      .attr("dx", ".25em")
      .style("text-anchor", "start")
      .text("Site");

    // FIXME: vertical spacing
    if (labels.length > 0) {
      var legend_dim = {x: 0, y:height - labelHeight + 10, spacer:15, margin:5, font: 10, x_step : 100};
      var me_colors = ['#2E66FF', '#FFB314'];
      var legend = svg.append("g")
          .attr("class", "gene_legend")
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
            .text(d);
        });
    }
  }
});


function addFront(elt, arr) {
  // add `elt` to front of `arr`, without modifying `arr`.
  var result = [elt];
  result.pushObjects(arr);
  return result;
}
