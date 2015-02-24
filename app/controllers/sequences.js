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

  // TODO: do not hard-code
  predefinedRegions: [
    {name: 'V1', start: 131, stop: 156},
    {name: 'V2', start: 157, stop: 196},
    {name: 'V3', start: 296, stop: 330},
    {name: 'V4', start: 385, stop: 418},
    {name: 'V5', start: 461, stop: 471},
    {name: 'MPER', start: 662, stop: 683}
  ],

  selectedCopyNumber: function() {
    var seqs = this.get('selectedSequences');
    var result = 0;
    for (var i=0; i<seqs.length; i++) {
      result += seqs[i].copyNumber;
    }
    return result;
  }.property('selectedSequences.@each'),

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
  // used in plotting
  posSites: function () {
    var data = this.get('model.frequencies');
    var pos_sites = [];
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        if (get_site_residues(data, k).length > 1) {
          pos_sites[+k] = data[k];
        }
      }
    }
    return pos_sites;
  }.property('model.frequencies.@each'),

});


function get_site_residues (data, site) {
  var all_residues = {};
  for (var k in data[site]) {
    if (k !== "HXB2") {
      for (var r in data[site][k]) {
        all_residues[r] = 1;
      }
    }
  }
  return d3.keys (all_residues).sort();
}
