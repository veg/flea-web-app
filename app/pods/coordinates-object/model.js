import Ember from 'ember';
import {zeroIndex} from 'flea-app/utils/utils';

export default Ember.Object.extend({
  data: [],

  refRange: function() {
    // 0-indexed [start, stop) reference coordinates
    var alnToRef = this.get('alnToRefCoords');
    return [alnToRef[0], alnToRef[alnToRef.length - 1] + 1];
  }.property('alnToRefCoords'),

  alnToRefCoords: function () {
    // maps from alignment coordinates to reference coordinates
    // both 0-indexed.
    var data = this.get('data');
    return data.map(c => zeroIndex(c));
  }.property('data.[]'),

  refToAlnCoords: function() {
    var alnToRef = this.get('alnToRefCoords');
    var stop = this.get('refRange')[1];
    var toFirst = new Array(stop);
    var toLast = new Array(stop);
    var last_ref_index = -1;
    for (let aln_index=0; aln_index<alnToRef.length; aln_index++) {
      var ref_index = alnToRef[aln_index];
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
  }.observes('alnToRefCoords'),

  refToFirstAlnCoords: function () {
    // inverse of alnToRefCoords.
    // maps reference coordinates to alignment coordinates
    // both 0-indexed
    return this.refToAlnCoords()[0];
  }.property('alnToRefCoords'),

  refToLastAlnCoords: function () {
    return this.refToAlnCoords()[1];
  }.property('alnToRefCoords')
});
