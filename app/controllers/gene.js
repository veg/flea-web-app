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

  getRate: function(data, idx) {
    var result = data.map(function(d) {
      return d.rates.map(function(r) {
        return r[idx];
      });
    });
    return result;
  },

  meanDS: function() {
    var rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 0);
  }.property('model.rates.sortedRates.[].[]'),

  meanDN: function() {
    var rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 1);
  }.property('model.rates.sortedRates.[].[]'),

  entropy: function() {
    var rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 4);
  }.property('model.rates.sortedRates.[].[]'),

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
    var sorted = this.get('model.rates.sortedRates');
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
  }.property('model.rates.sortedRates.[].[]'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'model.rates.positiveSelection')
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
