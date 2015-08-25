import Ember from 'ember';

export default Ember.Component.extend({

  tagName: '',

  // bound by caller
  values: [],
  selectedIdx: 0,

  maxIdx: function() {
    this.set('selectedIdx', 0);
    return this.get('values.length') - 1;
  }.property('values.length'),

  setSelectedIdx: function() {
    this.sendAction('selectedIdxChanged', this.get('selectedIdx'));
  }.observes('selectedIdx')
});
