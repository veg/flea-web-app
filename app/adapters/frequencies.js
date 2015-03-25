import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

var FrequencyObject = Ember.Object.extend({
  data: [],

  alnToRefCoords: function () {
    // maps from alignment coordinates to reference coordinates
    // both 0-indexed.
    var data = this.get('data');
    var coords = [];
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        coords.push ([parseInt(k) - 1, parseInt(data[k]['HXB2']) - 1]);
      }
    }
    coords.sort (function (a,b) {return a[0] - b[0];});
    return coords.map (function (d) {return d[1];});
  }.property('data.@each'),

  refToFirstAlnCoords: function () {
    // inverse of alnToRefCoords.
    // maps reference coordinates to alignment coordinates
    // both 0-indexed
    var alnToRef = this.get('alnToRefCoords');
    var maxIndex = alnToRef[alnToRef.length - 1];
    var result = new Array(maxIndex);
    var refIndex;
    var aln_index = 0;
    for (var ref_index=0; ref_index<result.length; ref_index++) {
      while (alnToRef[aln_index] < ref_index) {
        aln_index += 1;
      }
      result[ref_index] = aln_index;
    }
    return result;
  }.property('alnToRefCoords'),

  refToLastAlnCoords: function () {
    // inverse of alnToRefCoords.
    // maps reference coordinates to alignment coordinates
    // both 0-indexed
    var alnToRef = this.get('alnToRefCoords');
    var maxIndex = alnToRef[alnToRef.length - 1];
    var result = new Array(maxIndex);
    var refIndex;
    for (var i=0; i<alnToRef.length; i++) {
      refIndex = alnToRef[i];
      result[refIndex] = i;
    }
    return result;
  }.property('alnToRefCoords'),
});

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/frequencies';
    return request(url).then(function(data) {
      return FrequencyObject.create({data: data});
    });
  }
});
