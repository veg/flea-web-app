import Ember from 'ember';

export default Ember.ObjectController.extend({

  selectedSequences: [],

  // TODO: maybe these should be in a View instead
  rangeStart: 160,
  rangeStop: 200,
  minCoord: 1,
  maxCoord: 800,  // TODO: fix this dynamically

  filterSequenceTypes: function(type) {
    var all_sequences = this.get('model');
    return all_sequences.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  displaySequences: function() {
    return this.filterSequenceTypes('Observed');
  }.property('model@each'),

  mrca: function() {
    return this.filterSequenceTypes('MRCA')[0];
  }.property('model@each')

});
