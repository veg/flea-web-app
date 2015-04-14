import Ember from 'ember';

import {zeroIndex, oneIndex, transformIndex} from '../utils/utils';

export default Ember.Component.extend({
  tagName: 'svg',
  classNames: ['sequence-canvas'],
  mainHeight: 30,
  axisHeight: 20,
  attributeBindings: ['width', 'height'],

  alnRanges: null,
  alnLen: 1,
  selectedPositions: null,
  predefinedRegions: null,
  alnToRefCoords: null,

  tick: 100,

  width: Ember.computed.alias('alnLen'),

  height: function() {
    return this.get('mainHeight') + this.get('axisHeight');
  }.property('mainHeight', 'axisHeight'),

  didInsertElement: function() {
    this.drawMain();
    this.drawAxis();
    this.drawInsertions();
    this.drawPositive();
    this.drawSelected();
    this.drawRanges();
  },

  closedRanges: function() {
    return this.get('alnRanges').map(function(r) {
      return [r[0], r[1] - 1];
    });
  }.property('alnRanges'),

  drawMain: function() {
    var w = this.get('width');
    var h = this.get('mainHeight');
    var svg = d3.select('#' + this.get('elementId')).select('.main');

    // TODO: brushable to make new range

    var coords = [[0, h / 2, w, h / 2],
                 [0, h/3, 0, 2 * h / 3],
                 [w - 1, h/3, w - 1, 2 * h / 3]];

    var lines = svg.selectAll("lines")
        .data(coords)
        .enter()
        .append("line");

    lines
        .attr("x1", function(d) {return d[0];})
        .attr("y1", function(d) {return d[1];})
        .attr("x2", function(d) {return d[2];})
        .attr("y2", function(d) {return d[3];})
        .attr("stroke-width", 1)
        .attr("stroke", "black");
  }.observes('width', 'mainHeight'),

  drawAxis: function() {
    var r2a = this.get('refToAlnCoords');
    var a2r = this.get('alnToRefCoords');
    var tick = this.get('tick');

    var nTicks = Math.max(Math.floor(a2r[a2r.length - 1] / tick), 0);

    // 0-indexed reference ticks we want, but they may not actually be available
    var wanted = _.range(1, nTicks + 1).map(function(i) {
      return zeroIndex(i * tick);
    });

    // transform to closest possible alignment indices
    var ticks = wanted.map(function(t) {
      return transformIndex(t, r2a, false);
    });

    var x = d3.scale.linear().domain([0, this.get('width')])
        .range([0, this.get('width')]);
    var xAxis = d3.svg.axis().scale(x).orient("bottom")
        .tickValues(ticks)
        .tickFormat(function(t) { return oneIndex(transformIndex(t, a2r, false)) });
    var svg = d3.select('#' + this.get('elementId')).select('.axis');

    svg
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.get('mainHeight') + ")")
      .call(xAxis);

  }.observes('width', 'mainHeight'),

  insertions: function() {
    // 0-indexed [start, stop] intervals
    var map = this.get('alnToRefCoords');
    var ranges = [];
    var current = false;
    var start = -1;
    var stop = -1;
    var len = map.length;
    for (var i=1; i<map.length; i++) {
      if (!current && map[i - 1] === map[i]) {
        current = true;
        start = i;
      } else if (current && map[i - 1] !== map[i]) {
        stop = i - 1;
        current = false;
        ranges.push([start, stop]);
      } else if (current && i + 1 === len) {
        stop = i;
        current = false;
        ranges.push([start, stop]);
      }
    }
    return ranges;
  }.property('alnToRefCoords'),

  drawInsertions: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.insertions');
    var insertions = this.get('insertions');
    var h = this.get('mainHeight') / 2;

    var lines = svg.selectAll("line").data(insertions, function(r) { return String(r); });

    lines.enter().append("line")
      .attr("x1", function(d) {return d[0];})
      .attr("y1", function() {return h;})
      .attr("x2", function(d) {return d[1];})
      .attr("y2", function() {return h;})
      .attr("stroke-width", 3)
      .attr("stroke", "black");

    lines.exit().remove();

  }.observes('insertions', 'mainHeight'),

  drawPositive: function() {
    var posns = [];
    if (this.get('markPositive')) {
      posns = this.get('positiveSelection')[0];
    }
    var h = this.get('mainHeight');
    var svg = d3.select('#' + this.get('elementId')).select('.positive');
    var lines = svg.selectAll("line").data(posns, function(p) { return p; });

    lines.enter().append("line")
      .attr("x1", function(d) {return d;})
      .attr("y1", function() {return h / 3;})
      .attr("x2", function(d) {return d;})
      .attr("y2", function() {return 2 * h / 3;})
      .attr("stroke-width", 1)
      .attr("stroke", "green");

    lines.exit().remove();
  }.observes('markPositive', 'positiveSelection', 'mainHeight'),

  drawSelected: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.selected');
    var h = this.get('mainHeight');
    var posns = this.get('selectedPositions').toArray();

    var lines = svg.selectAll("line").data(posns, function(p) { return p; });

    lines.enter().append("line")
      .attr("x1", function(d) {return d;})
      .attr("y1", function() {return 0;})
      .attr("x2", function(d) {return d;})
      .attr("y2", function() {return h;})
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines.exit().remove();
  }.observes('selectedPositions.[]', 'mainHeight'),

  drawRanges: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.ranges');
    var h = this.get('mainHeight');
    var ranges = this.get('closedRanges');
    var self = this;
    var totalWidth = this.get('width');

    function dragmove(d) {
      var dx = d3.round(+d3.event.dx);
      var width = +this.getAttribute('width');
      var x = (+this.getAttribute('x')) + dx;
      if (x >= 0 && x + width + 1 <= totalWidth) {
        d3.select(this)
          .attr("x", x);
      }
    }

    function dragend(d) {
      var idx = +this.getAttribute('idx');
      var start = (+this.getAttribute('x'));
      var width = +this.getAttribute('width');
      var range = [start, start + width + 1];
      self.sendAction('updateRange', idx, range);
    }

    var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    var rects = svg.selectAll("rect").data(ranges, function(r) { return String(r); });

    rects.enter().append("rect")
      .attr("x", function(d) {return d[0];})
      .attr("y", function() {return 0;})
      .attr("idx", function(d, i) {return i;})
      .attr("width", function(d) {return d[1] - d[0];})
      .attr("height", function() {return h;})
      .attr("stroke-width", 1)
      .attr("stroke", "blue")
      .style("fill", "blue")
      .attr("fill-opacity", 0.1)
      .call(drag);

    rects.exit().remove();
  }.observes('closedRanges', 'width', 'mainHeight')

});
