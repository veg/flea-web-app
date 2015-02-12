import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Controller.extend({

  labels: function() {
    return ['Mean dS', 'Mean dN'];
  },

  sortedRates: function () {
    var rates = this.get('model.rates');
    var timepoints = rates.filter(function(d) {return d.date !== 'Combined';});
    var combined = rates.filter(function(d) {return d.date === 'Combined';});
    timepoints.sort(function (a,b) {return a.date - b.date;});
    timepoints.splice(0, 0, combined[0]);
    return timepoints;
  }.property('model.rates@each'),

  getRate: function(data, idx) {
    var result = data.map(function(d) {
      return d.rates.map(function(r) {
        return r[idx];
      });
    });
    return result;
  },

  meanDS: function() {
    var rates = this.get('sortedRates');
    return this.getRate(rates, 0);
  }.property('sortedRates@each'),


  meanDN: function() {
    var rates = this.get('sortedRates');
    return this.getRate(rates, 1);
  }.property('sortedRates@each'),


  entropy: function() {
    var rates = this.get('sortedRates');
    return this.getRate(rates, 4);
  }.property('sortedRates@each'),

  names: function() {
    var sorted = this.get('sortedRates');
    var result = sorted.map(function(d) {
      var name = d.date;
      if (name === 'Combined') {
        return name;
      }
      if(isString(name)) {
        name = parse_date(name);
      }
      return format_date(name);
    });
    return result;
  }.property('sortedRates@each'),

  // _positive_selection
  positiveSelection: function() {
    var result = {};
    var data = this.get('sortedRates');
    for (var k=0; k<data.length; k++) {
      result[data[k].date] = positive_selection_positions(data[k].rates);
    }
    return result;
  }.property('sortedRates'),

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

// 1-based indexing
function positive_selection_positions (mx) {
  return mx.map (function (d, i) {
    return [i, d[2]];
  }).filter (function (d) {
    return d [1] >= 0.95;
  }).map (function (d) {
    return d[0] + 1;
  });
}
