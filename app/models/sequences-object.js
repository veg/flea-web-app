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

  idToMotif: function() {
    var seqs = this.get('observedAndMrca');
    var positions = this.get('selectedPositions').sort((a, b) => a - b);
    return seqs.reduce(function(acc, s) {
      acc[s.get('id')] = positions.map(idx => s.get('sequence')[idx]).join('');
      return acc;
    }, {});
  }.property('observedAndMrca.[]', 'selectedPositions.[]')
});
