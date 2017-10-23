import Ember from 'ember';
import {zeroIndex, oneIndex, transformIndex, alignmentTicks} from 'flea-app/utils/utils';
import WidthMixin from 'flea-app/mixins/width-mixin';

// FIXME: use an x-axis to scale to div width

export default Ember.Component.extend(WidthMixin, {
  tagName: 'svg',
  attributeBindings: ['width', 'height'],
  classNames: ['alignment-overview'],

  labelHeight: 15,
  mainHeight: 30,
  axisHeight: 20,

  // TODO: make this standard for all d3 components
  margins: {top: 0, right: 5, bottom: 0, left: 5},

  alnRanges: null,
  validAlnRange: [0, 1],
  selectedPositions: null,
  predefinedRegions: null,
  alnToRefCoords: null,
  refToFirstAlnCoords: null,
  refToLastAlnCoords: null,

  tick: 100,

  shiftKey: false,

  height: function() {
    return this.get('labelHeight') + this.get('mainHeight') + this.get('axisHeight') + this.get('margins.top') + this.get('margins.bottom');
  }.property('labelHeight', 'mainHeight', 'axisHeight', 'margins.top', 'margins.bottom'),

  innerWidth: function() {
    return this.get('width') - this.get('margins.left') - this.get('margins.right');
  }.property('width', 'margins.left', 'margins.right'),

  innerHeight: function() {
    return this.get('height') - this.get('margins.top') - this.get('margins.bottom');
  }.property('height', 'margins.top', 'margins.bottom'),

  transformGroup: function (){
    d3.select('#' + this.get('elementId')).select('.overview')
      .attr("transform", "translate(" + this.get('margins.left') + "," + this.get('margins.top') + ")");
  }.observes('labelHeight'),

  transformMain: function (){
    d3.select('#' + this.get('elementId')).select('.overview').select('.main')
      .attr("transform", "translate(0," + this.get('labelHeight') + ")");
  }.observes('labelHeight'),

  xscale: function() {
    return d3.scale.linear()
      .domain(this.get('validAlnRange'))
      .range([0, this.get('innerWidth')]);
  }.property('innerWidth'),

  didInsertElement: function() {
    this._super(...arguments);

    this.transformGroup();
    this.transformMain();
    this.drawTrack();
    this.drawAxis();
    this.drawLabels();
    this.drawRanges();
    this.drawSelected();
    this.drawInsertions();
    this.drawPositive();
    this.makeBrush();

    let self = this;
    let key = function() {
      if (self._state === "inDOM") {
        self.set('shiftKey', d3.event.shiftKey);
      }
    };

    d3.select(window).on("keydown", key);
    d3.select(window).on("keyup", key);
  },

  drawTrack: function() {
    let w = this.get('innerWidth');
    let h = this.get('mainHeight');
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.track');

    let coords = [[0, h / 2, w, h / 2],
                 [0, h/3, 0, 2 * h / 3],
                 [w - 1, h/3, w - 1, 2 * h / 3]];

    let lines = svg.selectAll("lines")
        .data(coords);

    lines.exit().remove()
    lines.enter()
        .append("line");

    lines
      .attr("x1", d => d[0])
      .attr("y1", d => d[1])
      .attr("x2", d => d[2])
      .attr("y2", d => d[3])
      .attr("stroke-width", 1)
      .attr("stroke", "black");
  }.observes('innerWidth', 'mainHeight'),

  drawAxis: function() {
    let r2a = this.get('refToFirstAlnCoords');
    let a2r = this.get('alnToRefCoords');
    let tick = this.get('tick');
    let ticks = alignmentTicks(a2r, r2a, tick);
    let xscale = this.get('xscale');
    let xAxis = d3.svg.axis()
	.scale(xscale).orient("bottom")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.axis');

    svg
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (this.get('labelHeight') + this.get('mainHeight')) + ")")
      .call(xAxis);
  }.observes('innerWidth', 'xscale', 'mainHeight', 'labelHeight', 'refToFirstAlnCoords'),

  drawLabels: function() {
    let xscale = this.get('xscale');
    let mapFirst = this.get('refToFirstAlnCoords');
    let mapLast = this.get('refToLastAlnCoords');
    let regions = this.get('predefinedRegions');
    let svg = d3.select('#' + this.get('elementId')).select('.labels');

    let height = this.get('labelHeight');
    let h = height / 2;
    let self = this;

    let click = function(d) {
      let range = [d.start, d.stop];
      if (self.get('shiftKey')) {
        self.sendAction('addRange', range);
      } else {
        self.sendAction('setRanges', [range]);
      }
    };

    let text = svg.selectAll("text")
        .data(regions, d => d.name);

    let width = function(start, stop) {
      return mapLast[zeroIndex(stop)] - mapFirst[start];
    };

    text.exit().remove();
    text.enter()
      .append("text")
      .style("text-anchor", "middle")
      .style('dominant-baseline', 'middle')
      .text(d => d.name)
      .attr("font-family", "sans-serif")
      .attr("font-size", "8px");

    text
      .attr("x", d => xscale(mapFirst[d.start] + width(d.start, d.stop) / 2))
      .attr("y", () => h)

    let rects = svg.selectAll("rect")
        .data(regions, d => d.name);

    rects.exit().remove();
    rects.enter()
      .append("rect")
      .on('click', click)
      .style("cursor", "pointer")
      .attr("height", () => height)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("fill-opacity", 0);

    rects
      .attr("x", d => xscale(transformIndex(d.start, mapFirst, false)))
      .attr("y", () => 0)
      .attr("width", d => xscale(width(d.start, d.stop)));

  }.observes('innerWidth', 'xscale', 'predefinedRegions', 'labelHeight', 'refToFirstAlnCoords', 'refToLastAlnCoords'),

  makeBrush: function() {
    let self = this;
    let map = this.get('alnToRefCoords');

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.brush');

    let xscale = this.get('xscale');
    let brush = d3.svg.brush();

    let brushend = function() {
      let extent = brush.extent();
      let range = [transformIndex(d3.round(extent[0], 0), map, false),
                   transformIndex(d3.round(extent[1], 0), map, false) + 1];
      if (self.get('shiftKey')) {
        self.sendAction('addRange', range);
      } else {
        self.sendAction('setRanges', [range]);
      }
      brush.clear();
      svg.call(brush);
    };

    brush.x(xscale)
      .on("brushend", brushend);

    svg.call(brush)
      .selectAll('rect')
      .attr('height', this.get('mainHeight'));
  }.observes('xscale', 'mainHeight', 'alnToRefCoords'),

  insertions: function() {
    // 0-indexed [start, stop] intervals
    let map = this.get('alnToRefCoords');
    let ranges = [];
    let current = false;
    let start = -1;
    let stop = -1;
    let len = map.length;
    for (let i=1; i<map.length; i++) {
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
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.insertions');
    let insertions = this.get('insertions');
    let h = this.get('mainHeight') / 2;
    let lines = svg.selectAll("line").data(insertions, r => String(r));
    let xscale = this.get('xscale');

    lines.exit().remove();
    lines.enter()
      .append("line")
      .attr("stroke-width", 3)
      .attr("stroke", "black");

    lines
      .attr("x1", d => xscale(d[0]))
      .attr("y1", () => h)
      .attr("x2", d => xscale(d[1]))
      .attr("y2", () => h)
  }.observes('insertions', 'mainHeight', 'xscale'),

  drawPositive: function() {
    let posns = [];
    if (this.get('markPositive')) {
      posns = this.get('positiveSelection')[0];
    }
    let h = this.get('mainHeight');
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.positive');
    let lines = svg.selectAll("line").data(posns, function(p) { return p; });
    let xscale = this.get('xscale');

    lines.exit().remove();
    lines.enter()
      .append("line")
      .attr("stroke-width", 1)
      .attr("stroke", "green");

    lines
      .attr("x1", d => xscale(d))
      .attr("y1", () => h / 3)
      .attr("x2", d => xscale(d))
      .attr("y2", () => 2 * h / 3);

  }.observes('xscale', 'markPositive', 'positiveSelection', 'mainHeight'),

  drawSelected: function() {
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.selected');
    let h = this.get('mainHeight');
    let posns = this.get('selectedPositions');

    let lines = svg.selectAll("line").data(posns, p => p);
    let xscale = this.get('xscale');

    lines.exit().remove();
    lines.enter()
      .append("line")
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines
      .attr("x1", d => xscale(d))
      .attr("y1", () => 0)
      .attr("x2", d => xscale(d))
      .attr("y2", () => h);

  }.observes('xscale', 'selectedPositions.[]', 'mainHeight'),

  closedRanges: function() {
    return this.get('alnRanges').map(r => [r[0], r[1] - 1]);
  }.property('alnRanges'),

  drawRanges: function() {
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.ranges');
    let h = this.get('mainHeight');
    let ranges = this.get('closedRanges');
    let self = this;
    let totalWidth = this.get('innerWidth');
    let xscale = this.get('xscale');

    function dragmove() {
      let dx = d3.round(+d3.event.dx, 0);
      let width = +this.getAttribute('width');
      let x = (+this.getAttribute('x')) + dx;
      if (x >= 0 && x + width + 1 <= totalWidth) {
        d3.select(this)
          .attr("x", x);
      }
    }

    function dragend() {
      let idx = +this.getAttribute('idx');
      let start = (+this.getAttribute('x'));
      let width = +this.getAttribute('width');
      let range = [start, start + width + 1];
      self.sendAction('updateRange', idx, range);
    }

    let drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    // start from scratch every time
    svg.selectAll("rect").remove();

    svg.selectAll("rect").data(ranges)
      .enter()
      .append("rect")
      .attr("x", d => xscale(d[0]))
      .attr("y", () => 0)
      .attr("idx", (d, i) => i)
      .attr("width", d => xscale(d[1] - d[0]))
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
  }.observes('xscale', 'closedRanges', 'innerWidth', 'mainHeight')

});
