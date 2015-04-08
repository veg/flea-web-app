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
  predefinedRegions: null,
  refCoord: null,

  width: Ember.computed.alias('maxCoord'),

  didInsertElement: function() {
    var ctx = this.get('element').getContext('2d')
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.get('width'), this.get('height'));
  }
});


