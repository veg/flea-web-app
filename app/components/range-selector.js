import Ember from 'ember';

export default Ember.Component.extend({

  // bound by caller
  values: [],
  names: [],
  _selectedIdx: 0,

  selectedName: function() {
    return this.get('names')[this.get('selectedIdx')];
  }.property('names.@each', 'selectedIdx'),

  maxIdx: function() {
    return this.get('values.length') - 1;
  }.property('values.length'),

  selectedIdx: function(key, val) {
    if (arguments.length === 2) {
      this.set('_selectedIdx', Math.min(val, this.get('maxIdx')));
    }
    if (this.get('_selected') > this.get('maxIdx')) {
      this.set('_selectedIdx', this.get('maxIdx'));
    }
    return this.get('_selectedIdx');
  }.property('maxIdx'),

  resetIdx: function() {
    // reset selected to 0 if values change
    this.set('selectedIdx', 0);
  }.observes('values')
});
