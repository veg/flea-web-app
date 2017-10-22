import Ember from 'ember';
import {parse_date, isString, mapIfPresent} from 'flea-app/utils/utils';

export default Ember.Controller.extend({

  // FIXME: selecting and checking by string value is verbose and error-prone.
  _metrics: ["dNdS", "JS Divergence", "Entropy"],
  selectedMetric: "JS Divergence",
  markPositive: true,
  labelCoordinates: false,

  selectedTimepointIdx: 0,

  playing: false,

  application: Ember.inject.controller(),
  session: Ember.inject.controller(),

  currentPath: function() {
    var base = this.get('application.rootURL');
    var path = this.get('application.currentPath');
    var session_id = this.get('session.model.session_id');
    path = path.replace('session', session_id).replace('.', '/');
    return base + path;
  }.property('application.rootURL',
             'application.currentPath',
             'session.session_id'),

  metrics: function() {
    if (this.get('model.rates.exists')) {
      return this.get('_metrics');
    }
    return ["JS Divergence"];
  }.property('model.rates.exists', '_metrics'),

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

  divergence: function() {
    var divergence = this.get('model.divergence.sortedDivergence');
    return divergence.map(elt => elt.divergence);
  }.property('model.divergence.sortedDivergence'),

  addCombined: function() {
    return this.get('selectedMetric') === "JS Divergence";
  }.property('selectedMetric'),

  data1: function() {
    var metric = this.get('selectedMetric');
    if (metric === "Entropy") {
      return this.get('entropy');
    }
    else if (metric === "JS Divergence") {
      return this.get('divergence');
    }
    else if (metric === "dNdS") {
      return this.get('meanDS');
    }
    throw "Invalid metric";
  }.property('selectedMetric', 'divergence', 'entropy', 'meanDS'),

  data2: function() {
    var metric = this.get('selectedMetric');
    if (metric === "dNdS") {
      return this.get('meanDN');
    }
    return [];
  }.property('selectedMetric', 'divergence', 'entropy', 'meanDN'),

  structureData: function() {
    var metric = this.get('selectedMetric');
    if (metric === "Entropy") {
      return this.get('entropy');
    }
    if (metric === "JS Divergence") {
      return this.get('divergence');
    }
    if (metric === 'dNdS') {
      var dn = this.get('meanDN');
      var ds = this.get('meanDS');
      var result = [];
      for (let idx=0; idx<dn.length; idx++) {
        var zipped = _.zip(dn[idx], ds[idx]);
        var logratios = zipped.map(function(pair) {
          var logratio = Math.log(pair[0] / pair[1]);
          return logratio;
        });
        result.push(logratios);
      }
      return result;
    }
    throw {name: 'UnknownMetricError', message: metric};
  }.property('model.coordinates.refToFirstAlnCoords',
             'meanDN', 'meanDS', 'entropy', 'divergence', 'selectedTimepointIdx',
             'selectedMetric'),

  selectedStructureData: function() {
    var idx = this.get('selectedTimepointIdx');
    if (idx >= this.get('names.length')) {
      // a hack; presumable selectedIdx will be updated later
      idx = this.get('names.length') - 1;
    }
    var data = this.get('structureData')[idx];
    // take only reference coordinates
    var coordMap = this.get('model.coordinates.refToFirstAlnCoords');
    var result = _.map(coordMap, alnCoord => data[alnCoord] || 0);
    return result;
  }.property('structureData', 'selectedTimepointIdx'),

  structureDataRange: function() {
    var data = this.get('structureData');
    var minval = d3.min(data, d => d3.min(d));
    var maxval = d3.max(data, d => d3.max(d));
    if (minval < 0 && maxval > 0) {
      var r = Math.max(Math.abs(minval), maxval);
      minval = -r;
      maxval = r;
    }
    return [minval, maxval];
  }.property('structureData'),

  timepoints: function() {
    if (this.get('selectedMetric') === "JS Divergence") {
      var divergence = this.get('model.divergence.sortedDivergence');
      return divergence.map(elt => elt.date);
    }
    var sorted = this.get('model.rates.sortedRates');
    var result = sorted.map(d => d.date);
    return result;
  }.property('model.rates.sortedRates.[].[]', 'selectedMetric'),

  names: function() {
    var timepoints = this.get('timepoints');
    var datemap = this.get('model.dates');
    var names = timepoints.map(function(name) {
      if (name === 'Combined') {
        return name;
      }
      if(isString(name)) {
        name = parse_date(name);
      }
      return mapIfPresent(datemap, name);
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
      if (value != null) {
        this.set('selectedMetric', value);
      }
    },

    selectTimepointIdx: function(value) {
      if (value != null) {
        this.set('selectedTimepointIdx', value);
      }
    }
  }
});
