import Ember from 'ember';
import {parse_date, format_date, isString} from '../../utils/utils';

export default Ember.Controller.extend({

  useEntropy: false,
  useTurnover: false,
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
    if (this.get('useTurnover')) {
      return ['Turnover'];
    }
    return ['Mean dS', 'Mean dN'];
  }.property('useEntropy', 'useTurnover'),

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

  turnover: function() {
    var turnover = this.get('model.turnover.sortedTurnover');
    return turnover.map(function(elt) {
      return elt.turnover;
    })
  }.property('model.turnover.sortedTurnover'),

  data1: function() {
    if (this.get('useEntropy')) {
      return this.get('entropy');
    }
    else if (this.get('useTurnover')) {
      return this.get('turnover');
    }
    return this.get('meanDS');
  }.property('useEntropy', 'useTurnover', 'turnover', 'entropy', 'meanDS'),

  data2: function() {
    if (this.get('useEntropy') || this.get('useTurnover')) {
      return [];
    }
    return this.get('meanDN');
  }.property('useEntropy', 'useTurnover', 'turnover', 'entropy', 'meanDN'),

  structureData: function() {
    var idx = this.get('selectedTimepointIdx');
    if (idx >= this.get('names.length')) {
      // a hack; presumable selectedIdx will be updated later
      idx = this.get('names.length') - 1;
    }
    if (this.get('useEntropy')) {
      return this.get('entropy')[idx];
    }
    if (this.get('useTurnover')) {
      return this.get('turnover')[idx];
    }
    var dn = this.get('meanDN');
    var ds = this.get('meanDS');
    var zipped = _.zip(dn[idx], ds[idx]);
    // TODO: do not hardcode these values
    // FIXME: fix issue when number of timepoints changes; selector should remain on current one if possible
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
  }.property('model.frequencies.refToFirstAlnCoords',
             'meanDN', 'meanDS', 'entropy', 'turnover', 'selectedTimepointIdx',
             'useEntropy', 'useTurnover'),

  timepoints: function() {
    var sorted = this.get('model.rates.sortedRates');
    var result = sorted.map(function(d) {
      return d.date;
    });
    if (this.get('useTurnover')) {
      result.splice(0, 2);
    }
    return result;
  }.property('model.rates.sortedRates.[].[]', 'useTurnover'),

  names: function() {
    var timepoints = this.get('timepoints');
    var names = timepoints.map(function(name) {
      if (name === 'Combined') {
        return name;
      }
      if(isString(name)) {
        name = parse_date(name);
      }
      return format_date(name);
    });
    return names;
  }.property('timepoints.@each'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'model.rates.positiveSelection')
});
