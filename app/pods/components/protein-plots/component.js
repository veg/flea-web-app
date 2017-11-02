import Ember from 'ember';
import { once } from "@ember/runloop"

import { computed, observes } from 'ember-decorators/object';
import { PropTypes } from 'ember-prop-types';

import D3Plot from "flea-app/mixins/d3-plot-mixin";
import { oneIndex, alignmentTicks } from 'flea-app/utils/utils';
import WidthMixin from 'flea-app/mixins/width-mixin';


// input: (first is used for brushable navigation)
// - names ['name1', 'name2', ...]
// - data1 [[values], [values], ...]
// - data2 (may be empty)
// - positions - posns to mark (may be empty) [[posns], [posns], ...]
// - labels ['label1'] or ['label1', 'label2']
// refToFirstAlnCoords
// alnToRefCoords


export default Ember.Component.extend(D3Plot, WidthMixin, {

   propTypes: {
     names: PropTypes.EmberObject.isRequired,
     data1: PropTypes.EmberObject.isRequired,
     data2: PropTypes.EmberObject.isRequired,
     selectedPostions: PropTypes.array,
     labels: PropTypes.EmberObject.isRequired,
     url: PropTypes.string.isRequired,
     alnToRefCoords: PropTypes.EmberObject.isRequired,
     refToFirstAlnCoords: PropTypes.EmberObject.isRequired,
   },

  getDefaultProps() {
    return {
      selectedPostions: [],
    };
  },

  heightEach: 80,
  labelHeight: 25,

  tick: 100,
  yticks: 5,

  margins: {
    top:    20,
    right:  20,
    bottom: 50,
    left:   30
  },

  @computed('margins', 'nPlots', 'heightEach', 'labelHeight')
  height(margins, nPlots, heightEach, labelHeight) {
    return margins.top + margins.bottom + nPlots * heightEach + labelHeight;
  },

  @observes('names.[]', 'data1', 'data2', 'selectedPositions',
	    'labels.[]', 'width', 'height', 'heightEach',
	    'margins', 'yMax', 'labelHeight')
  onChartChange() {
    // FIXME: this gets called multiple times
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateChart');
  },

  @computed('data1', 'data2')
  yMax(data1, data2) {
    return [d3.max(R.flatten(data1)), d3.max(R.flatten(data2))];
  },

  nPlots: Ember.computed.alias('names.length'),

  _updateChart() {
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

  _removeAll() {
    let svg = d3.select('#' + this.get('elementId')).select('.inner');

    svg.selectAll("path").remove();
    svg.selectAll("g").remove();
    svg.selectAll("defs").remove();
  },

  __updateChart() {
    let names = this.get('names');
    let data1 = this.get('data1');
    let data2 = this.get('data2');
    let positions = this.get('selectedPositions');
    let labels = this.get('labels');

    // assume all arrays have same length
    let n_sites = data1[0].length;
    let n_plots = this.get('nPlots');
    let two_d = data2.length > 0;

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

    let width = this.get('innerWidth');
    let height = this.get('innerHeight');
    let height_each = this.get('heightEach');

    // necessary for clip path url
    // FIXME: there must be a more ember-friendly way to do this
    let url = this.get('url');

    let make_cx = function (d) {return x(d);};

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
    let svg = d3.select('#' + this.get('elementId')).select('.inner');

    svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    svg = svg.append("g");

    let x = d3.scale.linear()
        .range([0, width])
        .domain([1, n_sites]);

    let x_overall = d3.scale.linear()
        .range([0, width])
        .domain([1, n_sites]);

    let brush = d3.svg.brush()
        .x(x_overall)
        .on("brush", brushed);

    let ymax = this.get('yMax');
    let y = d3.scale.linear()
        .range([height_each, 0])
        .domain([two_d ? -ymax[1] : 0, ymax[0]]);

    let r2a = this.get('refToFirstAlnCoords');
    let a2r = this.get('alnToRefCoords');
    let tick = this.get('tick');
    let ticks = alignmentTicks(a2r, r2a, tick);

    let xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));

    let xAxis_overall = d3.svg.axis()
        .scale(x_overall)
        .orient("top")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));

    let xAxis_blank = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(0)
        .tickFormat('');

    let yAxis = d3.svg.axis()
        .scale(y)
        .orient("right")
        .ticks(this.get('yticks'));

    let focus_plots  = [];
    let area_objects = [];

    for (let plot_id = 0; plot_id < names.length; plot_id++) {
      let plot_svg = svg.append ("g")
          .attr("transform", "translate(0," + (height_each * plot_id) + ")");
      let local_areas = [];
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

      // blank x axis
      plot_svg.append("g")
        .attr("class", "pos x axis")
        .attr("transform", "translate(0," + height_each + ")")
        .call(xAxis_blank);

      // yaxis
      plot_svg.append("g")
        .attr("class", "pos y axis")
        .attr("transform", "translate(" + width + " ,0)")
        .call(yAxis);
        // .append("text")
        // .attr("transform", "translate(0,0)")
        // .attr("dy", "-.4em")
        // .attr("dx", ".25em")
        // .style("text-anchor", "start")
        // .text("Site");

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
      if (!R.isEmpty(positions) && plot_id < positions.length) {
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

    let labelHeight = this.get('labelHeight');

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
      let legend_dim = {x: 0, y:height - labelHeight + 10, spacer:15, margin:5, font: 10, x_step : 100};
      let me_colors = ['#2E66FF', '#FFB314'];
      let legend = svg.append("g")
          .attr("class", "protein_legend")
          .attr("x", legend_dim.x)
          .attr("y", legend_dim.y)
          .attr("transform", "translate("+legend_dim.x+","+legend_dim.y+")");
      legend.selectAll('g').data(labels)
        .enter()
        .append('g')
        .each(function(d, i) {
          let g = d3.select(this);
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
