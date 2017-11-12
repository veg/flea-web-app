import Ember from 'ember';

import { computed, observes } from 'ember-decorators/object';
import { PropTypes } from 'ember-prop-types';


import {zeroIndex, oneIndex, transformIndex, alignmentTicks} from 'flea-web-app/utils/utils';
import WidthMixin from 'flea-web-app/mixins/width-mixin';

// FIXME: use an x-axis to scale to div width

export default Ember.Component.extend(WidthMixin, {

   propTypes: {
     alnRanges: PropTypes.EmberObject,
     validAlnRange: PropTypes.EmberObject,
     selectedPositions: PropTypes.EmberObject,
     predefinedRegions: PropTypes.EmberObject,
     alnToRefCoords: PropTypes.EmberObject,
     refToFirstAlnCoords: PropTypes.EmberObject,
     refToLastAlnCoords: PropTypes.EmberObject,

     labelHeight: PropTypes.number,
     mainHeight: PropTypes.number,
     axisHeight: PropTypes.number,
     tick: PropTypes.number,
   },

  getDefaultProps() {
    return {
      labelHeight: 15,
      mainHeight: 30,
      axisHeight: 20,
      margins: {top: 0, right: 5, bottom: 0, left: 5},
      tick: 100,
    };
  },

  tagName: 'svg',
  attributeBindings: ['width', 'height'],
  classNames: ['alignment-overview'],

  shiftKey: false,

  @computed('labelHeight', 'mainHeight', 'axisHeight', 'margins')
  height(labelHeight, mainHeight, axisHeight, margins) {
    return labelHeight + mainHeight + axisHeight + margins.top + margins.bottom;
  },

  @computed('width', 'margins')
  innerWidth(width, margins) {
    return width - margins.left - margins.right;
  },

  @computed('height', 'margins')
  innerHeight(height, margins) {
    return height - margins.top - margins.bottom;
  },

  @observes('margins')
  transformGroup() {
    let margins = this.get('margins');
    d3.select('#' + this.get('elementId')).select('.overview')
      .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
  },

  @observes('labelHeight')
  transformMain() {
    let labelHeight = this.get('labelHeight');
    d3.select('#' + this.get('elementId')).select('.overview').select('.main')
      .attr("transform", "translate(0," + labelHeight + ")");
  },

  @computed('validAlnRange', 'innerWidth')
  xscale(validAlnRange, innerWidth) {
    return d3.scale.linear()
      .domain(validAlnRange)
      .range([0, innerWidth]);
  },

  didInsertElement() {
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

  @observes('innerWidth', 'mainHeight')
  drawTrack() {
    let w = this.get('innerWidth');
    let h = this.get('mainHeight')
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.track');

    let coords = [{'x1': 0, 'y1': h / 2, 'x2': w, 'y2': h / 2, 'name': 'middle'},
                  {'x1': 0, 'y1': h/3, 'x2': 0, 'y2': 2 * h / 3, 'name': 'left'},
                  {'x1': w - 1, 'y1': h/3, 'x2': w - 1, 'y2': 2 * h / 3, 'name': 'right'}
                 ];

    let lines = svg.selectAll("line").data(coords, c => c.name);

    lines.exit().remove()
    lines.enter()
        .append("line");

    lines
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("stroke-width", 1)
      .attr("stroke", "black");
  },

  @observes('refToFirstAlnCoords.[]', 'alnToRefCoords.[]',
            'tick', 'xscale',
             'labelHeight', 'mainHeight')
  drawAxis() {
    let r2a = this.get('refToFirstAlnCoords');
    let a2r = this.get('alnToRefCoords');
    let tick = this.get('tick');
    let xscale = this.get('xscale');
    let labelHeight = this.get('labelHeight');
    let mainHeight = this.get('mainHeight');

    let ticks = alignmentTicks(a2r, r2a, tick);
    let xAxis = d3.svg.axis()
        .scale(xscale).orient("bottom")
        .tickValues(ticks)
        .tickFormat(t => oneIndex(a2r[t]));

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.axis');

    svg
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (labelHeight + mainHeight) + ")")
      .call(xAxis);
  },

  @observes('xscale', 'refToFirstAlnCoords.[]', 'refToLastAlnCoords.[]',
            'predefinedRegions', 'labelHeight')
  drawLabels() {
    let xscale = this.get('xscale');
    let mapFirst = this.get('refToFirstAlnCoords');
    let mapLast = this.get('refToLastAlnCoords');
    let regions = this.get('predefinedRegions');
    let labelHeight = this.get('labelHeight');

    let svg = d3.select('#' + this.get('elementId')).select('.labels');
    let height = labelHeight;
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

    let width = (start, stop) => {
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
      .on('click', click.bind(this))
      .style("cursor", "pointer")
      .attr("height", () => height)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("fill-opacity", 0);

    rects
      .attr("x", d => xscale(transformIndex(d.start, mapFirst, false)))
      .attr("y", () => 0)
      .attr("width", d => xscale(width(d.start, d.stop)));

  },

  @observes('alnToRefCoords', 'xscale', 'mainHeight')
  makeBrush() {
    let map = this.get('alnToRefCoords');
    let xscale = this.get('xscale');
    let mainHeight = this.get('mainHeight');

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.brush');
    let brush = d3.svg.brush();

    let self = this;
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
      .attr('height', mainHeight);
  },

  @computed('alnToRefCoords')
  insertions(map) {
    // map: 0-indexed [start, stop] intervals
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
  },

  @observes('insertions', 'mainHeight', 'xscale')
  drawInsertions() {
    let insertions = this.get('insertions');
    let mainHeight = this.get('mainHeight');
    let xscale = this.get('xscale');

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.insertions');
    let h = mainHeight / 2;
    let lines = svg.selectAll("line").data(insertions, r => String(r));

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
  },

  @observes('xscale', 'markPositive', 'positiveSelection', 'mainHeight')
  drawPositive() {
    let xscale = this.get('xscale')
    let markPositive = this.get('markPositive');
    let positiveSelection = this.get('positiveSelection');
    let mainHeight = this.get('mainHeight');

    if (!positiveSelection) {
      return;
    }

    let posns = [];
    if (markPositive) {
      posns = positiveSelection;
    }
    let h = mainHeight;
    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.positive');
    let lines = svg.selectAll("line").data(posns);

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
  },

  @observes('xscale', 'selectedPositions.[]', 'mainHeight')
  drawSelected() {
    let xscale = this.get('xscale');
    let posns = this.get('selectedPositions');
    let mainHeight = this.get('mainHeight');

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.selected');
    let lines = svg.selectAll("line").data(posns);

    lines.exit().remove();
    lines.enter()
      .append("line")
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines
      .attr("x1", d => xscale(d))
      .attr("y1", () => 0)
      .attr("x2", d => xscale(d))
      .attr("y2", () => mainHeight);

  },

  @computed('alnRanges')
  closedRanges(alnRanges) {
    return alnRanges.map(r => [r[0], r[1] - 1]);
  },

  @observes('xscale', 'closedRanges', 'innerWidth',
	    'mainHeight', 'validAlnRange')
  drawRanges() {
    let xscale = this.get('xscale');
    let ranges = this.get('closedRanges');
    let innerWidth = this.get('innerWidth');
    let mainHeight = this.get('mainHeight');
    let validRange = this.get('validAlnRange');

    let svg = d3.select('#' + this.get('elementId')).select('.overview').select('.main').select('.ranges');
    let self = this;

    function dragmove() {
     let dx = +d3.event.dx;
      let width = +this.getAttribute('width');
      let x = (+this.getAttribute('x')) + dx;
      if (x >= 0 && x + width + 1 <= innerWidth) {
        d3.select(this)
          .attr("x", x);
      }
    }

    function dragend() {
      let idx = +this.getAttribute('idx');
      let x = (+this.getAttribute('x'));
      let width = +this.getAttribute('width');
      let start = d3.round(xscale.invert(x), 0);
      let stop = start + d3.round(xscale.invert(width)) + 1;
      start = Math.max(start, validRange[0]);
      stop = Math.min(stop, validRange[1]);
      self.sendAction('updateRange', idx, [start, stop]);
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
      .attr("height", () => mainHeight)
      .attr("stroke-width", 1)
      .attr("stroke", "blue")
      .style("fill", "blue")
      .attr("fill-opacity", 0.1)
      .call(drag)
      .on('click', function(d, i) {
        if (d3.event.defaultPrevented) {
          return;
        }
        self.sendAction('rmRange', i);
      });
  }

});
