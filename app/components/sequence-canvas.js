import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'svg',
  classNames: ['sequence-canvas'],
  height: 30,
  attributeBindings: ['width', 'height'],

  // bound to controller
  alnRanges: null,
  maxCoord: 1,
  selectedPositions: null,
  predefinedRegions: null,
  refCoord: null,

  width: Ember.computed.alias('maxCoord'),

  didInsertElement: function() {
    this.drawMain();
    this.drawPositive();
    this.drawSelected();
    this.drawRanges();
  },

  drawMain: function() {
    var w = this.get('width');
    var h = this.get('height');
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
  }.observes('width', 'height'),

  drawPositive: function() {
    var posns = [];
    if (this.get('markPositive')) {
      posns = this.get('positiveSelection')[0];
      // convert to 0-index
      posns = posns.map(function(p) { return p - 1; } );
    }
    var h = this.get('height');
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
  }.observes('markPositive', 'positiveSelection'),

  drawSelected: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.selected');
    var h = this.get('height');
    var posns = this.get('selectedPositions').toArray();

    // convert to 0-index
    posns = posns.map(function(p) { return p - 1; } );

    var lines = svg.selectAll("line").data(posns, function(p) { return p; });

    lines.enter().append("line")
      .attr("x1", function(d) {return d;})
      .attr("y1", function() {return 0;})
      .attr("x2", function(d) {return d;})
      .attr("y2", function() {return h;})
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines.exit().remove();
  }.observes('selectedPositions.[]'),

  drawRanges: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.ranges');
    var h = this.get('height');
    var ranges = this.get('alnRanges');
    var self = this;
    var totalWidth = this.get('width');

    function dragmove(d) {
      var x = d3.round(+d3.event.x);
      var width = +this.getAttribute('width');
      if (x >= 0 && x + width < totalWidth) {
        d3.select(this)
          .attr("x", x);
      }
    }

    function dragend(d) {
      var idx = +this.getAttribute('idx');
      var start = (+this.getAttribute('x')) + 1;  // convert back to 1-index
      var width = +this.getAttribute('width');
      var range = [start, start + width];
      self.sendAction('updateRange', idx, range);
    }

    var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    var rects = svg.selectAll("rect").data(ranges, function(r) { return String(r); });

    rects.enter().append("rect")
      .attr("x", function(d) {return d[0] - 1;}) // convert to 0-index
      .attr("y", function() {return 0;})
      .attr("idx", function(d, i) {return i;})
      .attr("width", function(d) {return d[1] - d[0];})
      .attr("height", function() {return h;})
      .attr("stroke-width", 1)
      .attr("stroke", "blue")
      .attr("fill-opacity", 0)
      .call(drag);

    rects.exit().remove();
  }.observes('alnRanges', 'maxCoord', 'height')

});
