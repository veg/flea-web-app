import Ember from 'ember';

export default Ember.Component.extend({

  tagName: '',
  _selectedIdx: 0,

  // bound by caller
  values: [],
  selectedIdx: 0,

  maxIdx: function() {
    return this.get('values.length') - 1;
  }.property('values.length'),

  _resetIdx: function() {
    this.set('_selectedIdx', 0);
  }.observes('values.length'),

  receiveIdx: function() {
    this.set('_selectedIdx', this.get('selectedIdx'));
  }.observes('selectedIdx'),

  setSelectedIdx: function() {
    this.sendAction('selectedIdxChanged', this.get('_selectedIdx'));
  }.observes('_selectedIdx')
});
