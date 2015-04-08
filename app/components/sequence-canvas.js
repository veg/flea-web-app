import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'canvas',
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
    this.set('ctx', this.get('element').getContext('2d'));
    this.draw();
  },

  draw: function() {
    console.log('drawing');
    this._empty();
    var ctx = this.get('ctx');
    var h = this.get('height');

    ctx.strokeRect(0, 0, this.get('width'), this.get('height'));

    // draw selected positions
    this.get('selectedPositions').forEach(function(p) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, h);
      ctx.stroke();
    });
  }.observes('maxCoord', 'predefinedRegions', 'refCoord', 'selectedPositions.[]'),

  _empty: function() {
    var ctx = this.get('ctx');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.get('width'), this.get('height'));
  }
});


