import Ember from 'ember';

export default Ember.ObjectController.extend({

  selectedSequences: [],

  // TODO: maybe these should be in a View instead
  rangeStart: 160,
  rangeStop: 200,
  minCoord: 1,

  collapseSeqs: true,
  maskUnchanged: true,
  markPositive: true,

  maxCoord: function() {
    return this.get('mrca').sequence.length;
  }.property('mrca'),

  filterSequenceTypes: function(seqs, type) {
    return seqs.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  observedSequences: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'Observed');
  }.property('model.sequences.@each'),

  mrca: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'MRCA')[0];
  }.property('model.sequences.@each'),

  // _hxb2_coords
  hxb2Coords: function () {
    var data = this.get('model.frequencies');
    var coords = [];
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        coords.push ([parseInt(k), parseInt(data[k]['HXB2'])]);
      }
    }
    coords.sort (function (a,b) {return a[0] - b[0];});
    return coords.map (function (d) {return d[1];});
  }.property('model.frequencies.@each'),

  // _pos_sites
  posSites: function () {
    var data = this.get('model.frequencies');
    var pos_sites = [];
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        if (get_site_residues(data, k).length > 1) {
          pos_sites [+k] = data[k];
        }
      }
    }
    return pos_sites;
  }.property('model.frequencies.@each'),

});
