import Ember from 'ember';
import {parse_date, format_date, isString} from '../../utils/utils';

export default Ember.Controller.extend({

  useEntropy: false,
  markPositive: true,

  selectedTimepointIdx: 0,

  needs: ['application', 'session'],

  currentPath: function() {
    var base = this.get('controllers.application.baseURL');
    var path = this.get('controllers.application.currentPath');
    var session_id = this.get('controllers.session.session_id');
    path = path.replace('session', session_id).replace('.', '/');
    return base + path;
  }.property('controllers.application.baseURL',
             'controllers.application.currentPath',
             'controllers.session.session_id'),

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

  structureData: function() {
    var dn = this.get('meanDN');
    var ds = this.get('meanDS');
    var zipped = _.zip(dn[0], ds[0]);
    // TODO: do not hardcode these values
    var upper = Math.log(5);
    var lower = Math.log(1/5);
    var ratios = zipped.map(function(pair) {
      var result = Math.log(pair[0] / pair[1]);
      // cap extreme values
      if (result > upper) {
        result = upper;
      } else if (result < lower) {
        result = lower;
      }
      return result;
    });
    // take only reference coordinates
    var coordMap = this.get('model.frequencies.refToFirstAlnCoords');
    var result = _.map(coordMap, function(alnCoord) {
      return ratios[alnCoord] || 0;
    });
    return result;
  }.property('model.frequencies.refToFirstAlnCoords', 'meanDN', 'meanDS'),

  timepoints: function() {
    var sorted = this.get('model.rates.sortedRates');
    return sorted.map(function(d) {
      return d.date;
    });
  }.property('model.rates.sortedRates.[].[]'),

  names: function() {
    var timepoints = this.get('timepoints');
    return timepoints.map(function(name) {
      if (name === 'Combined') {
        return name;
      }
      if(isString(name)) {
        name = parse_date(name);
      }
      return format_date(name);
    });
  }.property('timepoints.@each'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'model.rates.positiveSelection')
});
