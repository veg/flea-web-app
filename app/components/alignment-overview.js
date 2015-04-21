import Ember from 'ember';

import {zeroIndex, oneIndex, transformIndex} from '../utils/utils';


// FIXME: use an x-axis to scale to div width

export default Ember.Component.extend({
  tagName: 'svg',
  classNames: ['alignment-overview'],
  labelHeight: 10,
  mainHeight: 30,
  axisHeight: 20,
  attributeBindings: ['width', 'height'],

  alnRanges: null,
  alnLen: 1,
  selectedPositions: null,
  predefinedRegions: null,
  alnToRefCoords: null,

  tick: 100,

  shiftKey: false,

  width: Ember.computed.alias('alnLen'),

  height: function() {
    return this.get('labelHeight') + this.get('mainHeight') + this.get('axisHeight');
  }.property('labelHeight', 'mainHeight', 'axisHeight'),

  didInsertElement: function() {
    this.transformMain();
    this.drawLabels();
    this.drawTrack();
    this.drawInsertions();
    this.drawPositive();
    this.drawSelected();
    this.drawRanges();
    this.drawAxis();
    this.makeBrush();

    var self = this;
    var key = function() {
      self.set('shiftKey', d3.event.shiftKey);
    };

    d3.select(window).on("keydown", key);
    d3.select(window).on("keyup", key);
  },

  drawLabels: function() {
    var map = this.get('refToAlnCoords');
    var regions = this.get('predefinedRegions');
    var svg = d3.select('#' + this.get('elementId')).select('.labels');

    var height = this.get('labelHeight');
    var h = height / 2;
    var self = this;

    var click = function(d) {
      var range = [d.start, d.stop];
      if (self.get('shiftKey')) {
        self.sendAction('addRange', range);
      } else {
        self.sendAction('setRanges', [range]);
      }
    };

    var text = svg.selectAll("text")
        .data(regions, d => d.name);

    text
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .style('dominant-baseline', 'middle')
      .attr("x", d => transformIndex(d.start, map, false) + (transformIndex(d.stop, map, true) - transformIndex(d.start, map, false)) / 2)
      .attr("y", () => h)
      .text( d => d.name)
      .attr("font-family", "sans-serif")
      .attr("font-size", "8px");

    text.exit().remove();

    var rects = svg.selectAll("rect")
        .data(regions, d => d.name);

    rects
      .enter()
      .append("rect")
      .on('click', click)
      .style("cursor", "pointer")
      .attr("x", d => transformIndex(d.start, map, false))
      .attr("y", d => 0)
      .attr("width", d => transformIndex(d.stop, map, true) - transformIndex(d.start, map, false) - 1)
      .attr("height", d => height)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("fill-opacity", 0);

    rects.exit().remove();

  }.observes('predefinedRegions', 'labelHeight', 'refToAlnCoords'),

  transformMain: function (){
    d3.select('#' + this.get('elementId')).select('.main')
      .attr("transform", "translate(0," + this.get('labelHeight') + ")");
  }.observes('labelHeight'),

  closedRanges: function() {
    return this.get('alnRanges').map(r => [r[0], r[1] - 1]);
  }.property('alnRanges'),

  x: function() {
    return d3.scale.linear().domain([0, this.get('width')])
      .range([0, this.get('width')]);
  }.property('width'),

  makeBrush: function() {
    var self = this;
    var map = this.get('alnToRefCoords');

    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.brush');

    var x = this.get('x');
    var brush = d3.svg.brush();

    var brushend = function() {
      var extent = brush.extent();
      var alnRange = extent.map(function(i) {
        return d3.round(i, 0);
      });
      var range = [transformIndex(alnRange[0], map, false),
                   transformIndex(alnRange[1], map, false) + 1];
      if (self.get('shiftKey')) {
        self.sendAction('addRange', range);
      } else {
        self.sendAction('setRanges', [range]);
      }
      brush.clear();
      svg.call(brush);
    };

    brush.x(x)
      .on("brushend", brushend);

    svg.call(brush)
      .selectAll('rect')
      .attr('height', this.get('mainHeight'));
  }.observes('x', 'mainHeight', 'alnToRefCoords'),

  drawTrack: function() {
    var w = this.get('width');
    var h = this.get('mainHeight');
    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.track');

    var coords = [[0, h / 2, w, h / 2],
                 [0, h/3, 0, 2 * h / 3],
                 [w - 1, h/3, w - 1, 2 * h / 3]];

    var lines = svg.selectAll("lines")
        .data(coords)
        .enter()
        .append("line");

    lines
      .attr("x1", d => d[0])
      .attr("y1", d => d[1])
      .attr("x2", d => d[2])
      .attr("y2", d => d[3])
      .attr("stroke-width", 1)
      .attr("stroke", "black");
  }.observes('width', 'mainHeight'),

  drawAxis: function() {
    var r2a = this.get('refToAlnCoords');
    var a2r = this.get('alnToRefCoords');
    var tick = this.get('tick');

    var nTicks = Math.max(Math.floor(a2r[a2r.length - 1] / tick), 0);

    // 0-indexed reference ticks we want, but they may not actually be available
    var wanted = _.range(1, nTicks + 1).map(i => zeroIndex(i * tick));

    // transform to closest possible alignment indices
    var ticks = wanted.map(t => transformIndex(t, r2a, false));

    var x = this.get('x');
    var xAxis = d3.svg.axis().scale(x).orient("bottom")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(transformIndex(t, a2r, false)));
    var svg = d3.select('#' + this.get('elementId')).select('.axis');

    svg
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (this.get('labelHeight') + this.get('mainHeight')) + ")")
      .call(xAxis);
  }.observes('width', 'mainHeight', 'labelHeight'),

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
    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.insertions');
    var insertions = this.get('insertions');
    var h = this.get('mainHeight') / 2;

    var lines = svg.selectAll("line").data(insertions, r => String(r));

    lines.enter().append("line")
      .attr("x1", d => d[0])
      .attr("y1", () => h)
      .attr("x2", d => d[1])
      .attr("y2", () => h)
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
    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.positive');
    var lines = svg.selectAll("line").data(posns, function(p) { return p; });

    lines.enter().append("line")
      .attr("x1", d => d)
      .attr("y1", () => h / 3)
      .attr("x2", d => d)
      .attr("y2", () => 2 * h / 3)
      .attr("stroke-width", 1)
      .attr("stroke", "green");

    lines.exit().remove();
  }.observes('markPositive', 'positiveSelection', 'mainHeight'),

  drawSelected: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.selected');
    var h = this.get('mainHeight');
    var posns = this.get('selectedPositions').toArray();

    var lines = svg.selectAll("line").data(posns, p => p);

    lines.enter().append("line")
      .attr("x1", d => d)
      .attr("y1", () => 0)
      .attr("x2", d => d)
      .attr("y2", () => h)
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines.exit().remove();
  }.observes('selectedPositions.[]', 'mainHeight'),

  drawRanges: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.main').select('.ranges');
    var h = this.get('mainHeight');
    var ranges = this.get('closedRanges');
    var self = this;
    var totalWidth = this.get('width');

    function dragmove(d) {
      var dx = d3.round(+d3.event.dx, 0);
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

    svg.selectAll("rect").remove();

    svg.selectAll("rect").data(ranges)
      .enter()
      .append("rect")
      .attr("x", d => d[0])
      .attr("y", () => 0)
      .attr("idx", (d, i) => i)
      .attr("width", d => d[1] - d[0])
      .attr("height", () => h)
      .attr("stroke-width", 1)
      .attr("stroke", "blue")
      .style("fill", "blue")
      .attr("fill-opacity", 0.1)
      .call(drag)
      .on('click', function(d,i) {
        if (d3.event.defaultPrevented) {
          return;
        }
        self.sendAction('rmRange', i);
      });
  }.observes('closedRanges', 'width', 'mainHeight')

});
