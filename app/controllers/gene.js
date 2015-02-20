import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Controller.extend({

  useEntropy: false,
  markPositive: true,

  labels: function() {
    if (this.get('useEntropy')) {
      return ['Entropy'];
    }
    return ['Mean dS', 'Mean dN'];
  }.property('useEntropy'),

  sortedRates: function () {
    var rates = this.get('model');
    var timepoints = rates.filter(function(d) {return d.date !== 'Combined';});
    var combined = rates.filter(function(d) {return d.date === 'Combined';});
    timepoints.sort(function (a,b) {return a.date - b.date;});
    timepoints.splice(0, 0, combined[0]);
    return timepoints;
  }.property('model.@each'),

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
  }.property('sortedRates.[].[]'),

  meanDN: function() {
    var rates = this.get('sortedRates');
    return this.getRate(rates, 1);
  }.property('sortedRates.[].[]'),

  entropy: function() {
    var rates = this.get('sortedRates');
    return this.getRate(rates, 4);
  }.property('sortedRates.[].[]'),

  data1: function() {
    if (this.get('useEntropy')) {
      return this.get('entropy');
    }
    return this.get('meanDS');
  }.property('useEntropy', 'entropy.[].[]', 'meanDS.[].[]'),

  data2: function() {
      if (this.get('useEntropy')) {
      return [];
    }
    return this.get('meanDN');
  }.property('useEntropy', 'entropy.[].[]', 'meanDN.[].[]'),

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
  }.property('sortedRates.[].[]'),

  // _positive_selection
  positiveSelection: function() {
    var data = this.get('sortedRates');
    return data.map(function(d) {
      return positive_selection_positions(d.rates);
    });
  }.property('sortedRates'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('positiveSelection');
    }
    return [];
  }.property('markPositive', 'positiveSelection')
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
