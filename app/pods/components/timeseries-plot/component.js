import Ember from 'ember';
import { once } from "@ember/runloop"
import {mapIfPresent} from "flea-web-app/utils/utils";
import D3Plot from "flea-web-app/mixins/d3-plot-mixin";
import WidthHeightMixin from 'flea-web-app/mixins/width-height-mixin';
import { computed, observes } from 'ember-decorators/object';

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

export default Ember.Component.extend(D3Plot, WidthHeightMixin, {
  interpolation: "linear",

  ymin: null,
  data: [],
  data2: [],

  userColors: null,
  tickMap: {},

  margins: {
    top:    20,
    right:  50,
    bottom: 60,
    left:   50
  },

  @computed('data', 'data2')
  seriesNames(data1, data2) {
    let names1 = data1.map(d => d.name);
    let names2 = data2.map(d => d.name);
    return names1.concat(names2);
  },

  @computed('data.[]')
  dates(data) {
    // TODO: surely there is a better way?
    let result = data.map(d => d.values.map(e => e.x));
    result = d3.set(d3.merge(result)).values();
    result = result.map(d => new Date(d));
    return result;
  },

  @computed('dates.[]')
  xDomain(dates) {
    return d3.extent(dates);
  },

  @computed('xDomain', 'innerWidth')
  xScale(domain, innerWidth) {
    domain = domain.map(d => new Date(d));
    return d3.time.scale()
      .domain(domain)
      .range([0, innerWidth])
  },

  _yScale(data, minValue, innerHeight) {
    let maxValue = d3.max(data, d => d3.max(d.values, v => v.y));
    if (minValue === null) {
      minValue = d3.min(data, d => d3.min(d.values, v => v.y));
    }
    if (minValue === maxValue) {
      maxValue += 1;
      minValue = Math.max(0, minValue - 1);
    }
    return d3.scale.linear()
      .range([innerHeight, 0])
      .domain([minValue, maxValue]);
  },

  @computed('data.[]', 'ymin', 'innerHeight')
  yScale(data, ymin, innerHeight) {
    return this._yScale(data, ymin, innerHeight);
  },

  @computed('data2.[]', 'ymin', 'innerHeight')
  yScale2(data, ymin, innerHeight) {
    return this._yScale(data, ymin, innerHeight);
  },

  @computed('xScale', 'yScale', 'interpolation')
  d3Line(xScale, yScale, interpolation) {
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(interpolation);
  },

  @computed('xScale', 'yScale2', 'interpolation')
  d3Line2(xScale, yScale, interpolation) {
    return d3.svg.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .interpolate(interpolation);
  },

  @computed('tickMap')
  xAxisFormat(map) {
    return (d => mapIfPresent(map, d));
  },

  xTickValues: Ember.computed.alias('dates'),

  yAxisFormat: d3.format(".00"),

  @computed('userColors', 'seriesNames')
  seriesColors(colors, names) {
    if (colors !== null) {
      return colors;
    }
    if (names.length <= 10) {
      colors = d3.scale.category10();
    } else {
      colors = d3.scale.category20();
    }
    colors.domain(names);
    return colors;
  },

  _updateData(data, line, classname) {
    let svg = d3.select('#' + this.get('elementId')).select('.inner');
    let colors = this.get('seriesColors');

    let paths = svg.select(classname).selectAll('path')
        .data(data, d => d.name);

    paths.enter()
      .append("path")
      .attr("class", "timeseries_line");

    paths.attr("d", d => line(d.values))
      .style("stroke", d => colors(d.name));

    paths.exit().remove();
  },

  _updateChart() {
    this._updateData(this.get('data'), this.get('d3Line'), '.lines');
    this._updateData(this.get('data2'), this.get('d3Line2'), '.lines2');
  },

  @observes('data.[]', 'data2.[]',
            'd3Line', 'd3Line2',
            'xScale', 'yScale', 'yScale2')
  onChartChange() {
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateChart');
  }
});
