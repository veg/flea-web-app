import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Controller.extend({
  needs: ['application'],

  useEntropy: false,
  markPositive: true,

  currentPath: function() {
    return this.get('rootURL') + this.get('controllers.application.currentPath');
  }.property('rootURL', 'controllers.application.currentPath'),

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
    var rates = this.get('controllers.application.model.rates.sortedRates');
    return this.getRate(rates, 0);
  }.property('controllers.application.model.rates.sortedRates.[].[]'),

  meanDN: function() {
    var rates = this.get('controllers.application.model.rates.sortedRates');
    return this.getRate(rates, 1);
  }.property('controllers.application.model.rates.sortedRates.[].[]'),

  entropy: function() {
    var rates = this.get('controllers.application.model.rates.sortedRates');
    return this.getRate(rates, 4);
  }.property('controllers.application.model.rates.sortedRates.[].[]'),

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
    var sorted = this.get('controllers.application.model.rates.sortedRates');
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
  }.property('controllers.application.model.rates.sortedRates.[].[]'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('controllers.application.model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'controllers.application.model.rates.positiveSelection')
});
