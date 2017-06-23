import Ember from 'ember';

export default Ember.Object.extend({

  reference: null,
  mrca: null,
  observed: [],
  ancestors: [],


  // in alignment 0-indexed coordinates
  selectedPositions: [],

  observedAndMrca: function() {
    let seqs = this.get('observed');
    let mrca = this.get('mrca');
    return [mrca].concat(seqs);
  }.property('observed.[]', 'mrca'),

  idToMotif: function() {
    var seqs = this.get('observedAndMrca');
    var positions = this.get('selectedPositions').sort((a, b) => a - b);
    return seqs.reduce(function(acc, s) {
      acc[s.get('id')] = positions.map(idx => s.get('sequence')[idx]).join('');
      return acc;
    }, {});
  }.property('observedAndMrca.[]', 'selectedPositions.[]')
});
