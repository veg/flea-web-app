import Ember from 'ember';
import {zeroIndex} from '../utils/utils';

export default Ember.Object.extend({
  data: [],

  alnToRefCoords: function () {
    // maps from alignment coordinates to reference coordinates
    // both 0-indexed.
    var data = this.get('data');
    var coords = [];
    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        // TODO: change data format to rename 'HXB2' to 'reference'
        coords.push([zeroIndex(parseInt(k)), zeroIndex(parseInt(data[k]['HXB2']))]);
      }
    }
    coords.sort((a,b) => a[0] - b[0]);
    return coords.map(d => d[1]);
  }.property('data.@each'),

  refToFirstAlnCoords: function () {
    // inverse of alnToRefCoords.
    // maps reference coordinates to alignment coordinates
    // both 0-indexed
    var alnToRef = this.get('alnToRefCoords');
    var refLen = alnToRef[alnToRef.length - 1] + 1;
    var result = new Array(refLen);
    var aln_index = 0;
    for (let ref_index=0; ref_index<result.length; ref_index++) {
      while (alnToRef[aln_index] < ref_index) {
        aln_index += 1;
      }
      result[ref_index] = aln_index;
    }
    return result;
  }.property('alnToRefCoords'),

  refToLastAlnCoords: function () {
    // TODO: code duplication
    var alnToRef = this.get('alnToRefCoords');
    var refLen = alnToRef[alnToRef.length - 1] + 1;
    var result = new Array(refLen);
    var aln_index = 0;
    for (let ref_index=0; ref_index<result.length; ref_index++) {
      // advance aln_index as much as possible
      while (alnToRef[aln_index] <= ref_index && alnToRef[aln_index + 1] <= ref_index) {
        aln_index += 1;
      }
      result[ref_index] = aln_index;
    }
    return result;
  }.property('alnToRefCoords')
});
