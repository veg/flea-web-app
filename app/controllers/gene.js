import Ember from 'ember';


export default Ember.Controller.extend({

  // _pos_data
  positionDataCombined: function () {
    return this.get('model.rates').filter(function(d) {return d === 'Combined';});
  }.property('model.rates@each'),

  // _pos_overall_data
  positionDataIndividual: function () {
    var result = this.get('model.rates').filter(function(d) {return d !== 'Combined';});
    result.sort(function (a,b) {return a[0]-b[0];});
    return result;
  }.property('model.rates@each'),

  // _positive_selection
  positiveSelection: function() {
    var result = {};
    var data = this.get('positionDataIndividual');
    for (var k=0; k<data.length; k++) {
      result[data[k].date] = check_positive_selection(data[k].rates);
    }
    var combined = this.get('positionDataCombined');
    result['combined'] = check_positive_selection(combined.rates);
    return result;
  }.property('positionDataIndividual@each', 'positionDataCombined'),

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
  }.property('model.frequencies@each'),

  // TODO: code duplication
  // used for plotting only; ignored for now

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
  }.property('model.frequencies@each'),
});


function get_site_residues(data, site) {
  var all_residues = {};
  for (var k in data[site]) {
    if (data.hasOwnProperty(k)) {
      if (k !== "HXB2") {
        for (var residue in data[site][k]) {
          if (data[site][k].hasOwnProperty(residue)) {
            all_residues[residue] = 1;
          }
        }
      }
    }
  }
  return d3.keys (all_residues).sort();
}

function check_positive_selection (mx) {
  return mx.map (function (d, i) {
    return [i, d[2]];
  }).filter (function (d) {
    return d [1] >= 0.95;
  }).map (function (d) {
    return d[0] + 1;
  });
}
