import Ember from 'ember';
import { once } from "@ember/runloop"
import { computed, observes } from 'ember-decorators/object';

export default Ember.Component.extend({
  tagName:    'g',
  classNames: ['axis'],

  attributeBindings: ['transform'],

  scale:       null,
  orient:      'bottom',
  ticks:       10,
  tickValues:  null,
  tickSize:    5,
  tickFormat:  null,
  tickPadding: 5,
  rotate:      0,

  @computed('scale', 'orient', 'ticks',
	    'tickValues', 'tickSize',
            'tickFormat', 'tickPadding')
  d3Axis(scale, orient, ticks, tickValues, tickSize,
	 tickFormat, tickPadding) {
    let axis = d3.svg.axis();
    axis.scale(scale)
      .orient(orient)
      .ticks(ticks)
      .tickValues(tickValues)
      .tickFormat(tickFormat)
      .tickSize(tickSize)
      .tickPadding(tickPadding);
    return axis;
  },

  didInsertElement() {
    this._super(...arguments);
    this._updateAxis();
  },

  @observes('d3Axis', 'rotate')
  onD3AxisChange() {
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateAxis');
  },

  _updateAxis() {
    let axis = this.get('d3Axis');
    let svg = d3.select('#' + this.get('elementId')).call(axis);
    let rotate = this.get('rotate');
    if (rotate) {
      svg.selectAll ("text")
        .style("text-anchor", "start")
        .attr ("transform", "rotate(" + rotate + ")")
        .attr("dx","0.5em")
        .attr("dy","0.5em");
    }
  }
});
