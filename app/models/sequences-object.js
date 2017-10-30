import Ember from 'ember';
import {seqNameToProperty} from 'flea-app/utils/utils';
import { computed } from 'ember-decorators/object';

export default Ember.Object.extend({

  reference: null,
  mrca: null,
  observed: [],
  ancestors: [],

  // in alignment 0-indexed coordinates
  selectedPositions: [],

  @computed('observed.[]', 'mrca')
  observedAndMrca: function(seqs, mrca) {
    return [mrca].concat(seqs);
  },

  @computed('observedAndMrca.[]', 'ancestors.[]', 'selectedPositions.[]')
  nameToMotif: function() {
    let obs = this.get('observedAndMrca');
    let ancestors = this.get('ancestors');
    let seqs = obs.concat(ancestors);
    let positions = this.get('selectedPositions').sort((a, b) => a - b);
    let names = R.map(R.prop('name'), seqs);
    let motifs = R.map(s => positions.map(idx => s.get('sequence')[idx]).join(''), seqs);
    return R.zipObj(names, motifs);
  },

  @computed('observedAndMrca.[]')
  seqNameToDate: function() {
    return seqNameToProperty(this.get('observedAndMrca'), 'date');
  }

});
