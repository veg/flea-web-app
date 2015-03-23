import Ember from 'ember';

export default Ember.Component.extend({

  // bound by caller
  values: [],
  names: [],
  selectedIdx: 0,

  selectedName: function() {
    return this.get('names')[this.get('selectedIdx')];
  }.property('names.length', 'names.@each', 'selectedIdx'),

  maxIdx: function() {
    this.set('selectedIdx', 0);
    return this.get('values.length') - 1;
  }.property('values.length')
});