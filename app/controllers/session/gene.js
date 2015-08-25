import Ember from 'ember';
import {parse_date, format_date, isString} from '../../utils/utils';

export default Ember.Controller.extend({

  // FIXME: selecting and checking by string value is verbose and error-prone.
  metrics: ["dNdS", "Turnover", "Entropy"],
  selectedMetric: "dNdS",
  markPositive: true,

  selectedTimepointIdx: 0,

  playing: false,

  application: Ember.inject.controller(),
  session: Ember.inject.controller(),

  currentPath: function() {
    var base = this.get('application.baseURL');
    var path = this.get('application.currentPath');
    var session_id = this.get('session.model.session_id');
    path = path.replace('session', session_id).replace('.', '/');
    return base + path;
  }.property('application.baseURL',
             'application.currentPath',
             'session.session_id'),

  labels: function() {
    var metric = this.get('selectedMetric');
    if (metric === "dNdS") {
      return ['Mean dS', 'Mean dN'];
    }
    return [metric];
  }.property('selectedMetric'),

  getRate: function(data, idx) {
    var result = data.map(d => d.rates.map(r => r[idx]));
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
    return turnover.map(elt => elt.turnover);
  }.property('model.turnover.sortedTurnover'),

  addCombined: function() {
    return this.get('selectedMetric') === "Turnover";
  }.property('selectedMetric'),

  data1: function() {
    var metric = this.get('selectedMetric');
    if (metric === "Entropy") {
      return this.get('entropy');
    }
    else if (metric === "Turnover") {
      return this.get('turnover');
    }
    else if (metric === "dNdS") {
      return this.get('meanDS');
    }
    throw "Invalid metric";
  }.property('selectedMetric', 'turnover', 'entropy', 'meanDS'),

  data2: function() {
    var metric = this.get('selectedMetric');
    if (metric === "dNdS") {
      return this.get('meanDN');
    }
    return [];
  }.property('selectedMetric', 'turnover', 'entropy', 'meanDN'),

  structureData: function() {
    var idx = this.get('selectedTimepointIdx');
    if (idx >= this.get('names.length')) {
      // a hack; presumable selectedIdx will be updated later
      idx = this.get('names.length') - 1;
    }
    var metric = this.get('selectedMetric');
    if (metric === "Entropy") {
      return this.get('entropy')[idx];
    }
    if (metric === "Turnover") {
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
    var result = _.map(coordMap, alnCoord => ratios[alnCoord] || 0);
    return result;
  }.property('model.frequencies.refToFirstAlnCoords',
             'meanDN', 'meanDS', 'entropy', 'turnover', 'selectedTimepointIdx',
             'selectedMetric'),

  timepoints: function() {
    var sorted = this.get('model.rates.sortedRates');
    var result = sorted.map(d => d.date);
    if (this.get('selectedMetric') === "Turnover") {
      result.splice(0, 2);
    }
    return result;
  }.property('model.rates.sortedRates.[].[]', 'selectedMetric'),

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
  }.property('timepoints.[]'),

  selectedName: function() {
    return this.get('names')[this.get('selectedTimepointIdx')];
  }.property('names', 'selectedTimepointIdx'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'model.rates.positiveSelection'),

  startPlayback: function() {
    this.set('timer', this.schedule(this.get('nextTimepoint')));
    this.set('playing', true);
  },

  stopPlayback: function() {
    Ember.run.cancel(this.get('timer'));
    this.set('playing', false);
  }.observes('selectedMetric'),

  buttonClass: function() {
    if (this.get('playing')) {
      return "fa fa-stop";
    } else {
      return "fa fa-play";
    }
  }.property('playing'),

  interval: function() {
    return 1000; // Time between updates (in ms)
  }.property().readOnly(),

  // Schedules the function `f` to be executed every `interval` time.
  schedule: function(f) {
    return Ember.run.later(this, function() {
      f.apply(this);
      this.set('timer', this.schedule(f));
    }, this.get('interval'));
  },

  nextTimepoint: function(){
    var idx = (this.get('selectedTimepointIdx') + 1) % this.get('timepoints.length');
    this.set('selectedTimepointIdx', idx);
  },

  actions: {
    // FIXME: move viewer, selector, and play controls to a component.
    togglePlayback: function() {
      if (this.get('playing')) {
        this.stopPlayback();
      } else{
        this.startPlayback();
      }
    },

    selectMetric: function(value) {
      if (value) {
        this.set('selectedMetric', value);
      }
    },

    selectTimepointIdx: function(value) {
      if (value) {
        this.set('selectedTimepointIdx', value);
      }
    }
  }
});
