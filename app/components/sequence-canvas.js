import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'svg',
  classNames: ['sequence-canvas'],
  height: 50,
  attributeBindings: ['width', 'height'],

  // bound to controller
  alnRanges: null,
  minCoord: 1,
  maxCoord: 1,
  selectedPositions: null,
  predefinedRegions: null,
  refCoord: null,

  width: Ember.computed.alias('maxCoord'),

  didInsertElement: function() {
    this.drawMain();
    this.drawSelected();
  },

  drawMain: function() {
    var w = this.get('width');
    var h = this.get('height');
    var svg = d3.select('#' + this.get('elementId')).select('.main');

    var coords = [[0, h / 2, w, h / 2],
                 [0, h/3, 0, 2 * h / 3],
                 [w, h/3, w, 2 * h / 3]];

    var lines = svg.selectAll("lines")
        .data(coords)
        .enter()
        .append("line");

    var lineAttributes = lines
        .attr("x1", function(d) {return d[0];})
        .attr("y1", function(d) {return d[1];})
        .attr("x2", function(d) {return d[2];})
        .attr("y2", function(d) {return d[3];})
        .attr("stroke-width", 1)
        .attr("stroke", "black");
  }.observes('width', 'height'),

  drawSelected: function() {
    var svg = d3.select('#' + this.get('elementId')).select('.selected');
    var h = this.get('height');
    var posns = this.get('selectedPositions').toArray();

    console.log(posns);

    var lines = svg.selectAll("line").data(posns, function(p) { return p; });

    lines.enter().append("line")
      .attr("x1", function(d) {return d;})
      .attr("y1", function(d) {return 0;})
      .attr("x2", function(d) {return d;})
      .attr("y2", function(d) {return h;})
      .attr("stroke-width", 1)
      .attr("stroke", "red");

    lines.exit().remove();
  }.observes('selectedPositions.[]')
});
