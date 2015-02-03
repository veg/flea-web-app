import Ember from 'ember';

export default Ember.ObjectController.extend({

  selectedSequences: [],

  // TODO: maybe these should be in a View instead
  rangeStart: 160,
  rangeStop: 200,
  minCoord: 1,
  maxCoord: 800,  // TODO: fix this dynamically

  filterSequenceTypes: function(seqs, type) {
    return seqs.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  observedSequences: function() {
    var seqs = this.get('model');
    return this.filterSequenceTypes(seqs, 'Observed');
  }.property('model@each'),

  mrca: function() {
    var seqs = this.get('model');
    return this.filterSequenceTypes(seqs, 'MRCA')[0];
  }.property('model@each'),
});
