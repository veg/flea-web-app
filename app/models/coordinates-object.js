import Ember from 'ember';
import {zeroIndex, refToAlnCoords} from 'flea-web-app/utils/utils';
import { computed, observes } from 'ember-decorators/object';

export default Ember.Object.extend({
  data: [],

  @computed('alnToRefCoords')
  refRange: function(alnToRef) {
    // 0-indexed [start, stop) reference coordinates
    return [alnToRef[0], alnToRef[alnToRef.length - 1] + 1];
  },

  @computed('data.[]')
  alnToRefCoords: function (data) {
    // maps from alignment coordinates to reference coordinates
    // both 0-indexed.
    return data.map(c => zeroIndex(c));
  },

  @observes('alnToRefCoords')
  refToAlnCoords: function() {
    let alnToRef = this.get('alnToRefCoords');
    let stop = this.get('refRange')[1];
    let toFirst = new Array(stop);
    let toLast = new Array(stop);
    let last_ref_index = -1;
    for (let aln_index=0; aln_index<alnToRef.length; aln_index++) {
      let ref_index = alnToRef[aln_index];
      toLast[ref_index] = aln_index;
      if (ref_index !== last_ref_index) {
        toFirst[ref_index] = aln_index;
      }
      // fill in missing values
      if (last_ref_index > -1) {
        for (let missing_ref_index=last_ref_index + 1; missing_ref_index < ref_index; missing_ref_index++) {
          toFirst[missing_ref_index] = aln_index;
          toLast[missing_ref_index] = aln_index - 1;
        }
      }
      last_ref_index = ref_index;
    }
    return [toFirst, toLast];
  },

  @computed('alnToRefCoords', 'refRange')
  refToFirstAlnCoords: function (alnToRefCoords, refRange) {
    // inverse of alnToRefCoords.
    // maps reference coordinates to alignment coordinates
    // both 0-indexed
    return refToAlnCoords(alnToRefCoords, refRange[1])[0];
},

  @computed('alnToRefCoords', 'refRange')
  refToLastAlnCoords: function (alnToRefCoords, refRange) {
    return refToAlnCoords(alnToRefCoords, refRange[1])[1];
  }
});
