import Ember from 'ember';

export default Ember.Object.extend({

  sequences: [],
  mrca: null,
  reference: null,

  // in alignment 0-indexed coordinates
  selectedPositions: [],

  filterSequenceTypes: function(seqs, type) {
    return seqs.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  observedSequences: function() {
    var seqs = this.get('sequences');
    return this.filterSequenceTypes(seqs, 'Observed');
  }.property('sequences.[]'),

  observedAndMrca: function() {
    var seqs = this.get('sequences');
    seqs.push(this.get('mrca'));
    return seqs;
  }.property('sequences.[]', 'mrca'),

  updateMotifs: function() {
    var sequences = this.get('sequences');
    var positions = this.get('selectedPositions').sort((a, b) => a - b);
    for (let i=0; i<sequences.length; i++ ) {
      var seq = sequences.objectAt(i);
      if (positions.length === 0) {
        seq.set('motif', "");
      } else {
        seq.set('motif', positions.map(idx => seq.sequence[idx]).join(''));
      }
    }
  }.observes('selectedPositions.[]'),
});
