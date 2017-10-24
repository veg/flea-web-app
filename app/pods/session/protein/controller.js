import Ember from 'ember';
import {parse_date, isString, mapIfPresent} from 'flea-app/utils/utils';

export default Ember.Controller.extend({

  _metrics: ["JS Divergence", "dNdS", "Entropy"],
  selectedMetric: "JS Divergence",

  markPositive: true,
  labelCoordinates: false,

  // TODO: do not use two-way binding with slider.
  // TODO: when metric changes, this index might be invalid
  selectedTimepointIdx: 0,

  application: Ember.inject.controller(),
  session: Ember.inject.controller(),

  currentPath: function() {
    let base = this.get('application.rootURL');
    let path = this.get('application.currentPath');
    let session_id = this.get('session.model.session_id');
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
    let metric = this.get('selectedMetric');
    if (metric === "dNdS") {
      return ['Mean dS', 'Mean dN'];
    }
    return [metric];
  }.property('selectedMetric'),

  getRate: function(data, idx) {
    let result = data.map(d => d.rates.map(r => r[idx]));
    return result;
  },

  meanDS: function() {
    let rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 0);
  }.property('model.rates.sortedRates.[].[]'),

  meanDN: function() {
    let rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 1);
  }.property('model.rates.sortedRates.[].[]'),

  entropy: function() {
    let rates = this.get('model.rates.sortedRates');
    return this.getRate(rates, 4);
  }.property('model.rates.sortedRates.[].[]'),

  divergence: function() {
    let divergence = this.get('model.divergence.sortedDivergence');
    return divergence.map(elt => elt.divergence);
  }.property('model.divergence.sortedDivergence'),

  data1: function() {
    let metric = this.get('selectedMetric');
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
    let metric = this.get('selectedMetric');
    if (metric === "dNdS") {
      return this.get('meanDN');
    }
    return [];
  }.property('selectedMetric', 'divergence', 'entropy', 'meanDN'),

  structureData: function() {
    let metric = this.get('selectedMetric');
    if (metric === "Entropy") {
      return this.get('entropy');
    }
    if (metric === "JS Divergence") {
      return this.get('divergence');
    }
    if (metric === 'dNdS') {
      let dn = this.get('meanDN');
      let ds = this.get('meanDS');
      let result = [];
      for (let idx=0; idx<dn.length; idx++) {
        let zipped = _.zip(dn[idx], ds[idx]);
        let logratios = zipped.map(function(pair) {
          let logratio = Math.log(pair[0] / pair[1]);
          return logratio;
        });
        result.push(logratios);
      }
      return result;
    }
    throw {name: 'UnknownMetricError', message: metric};
  }.property('model.coordinates.refToFirstAlnCoords',
             'meanDN', 'meanDS', 'entropy', 'divergence',
             'selectedMetric'),

  selectedStructureData: function() {
    let idx = this.get('selectedTimepointIdx');

    // map data onto reference coordinates
    // we expect the pdb structure to contain reference coordinates
    // for the residues.
    let data = this.get('structureData')[idx];
    let coordMap = this.get('model.coordinates.refToFirstAlnCoords');
    let result = _.map(coordMap, alnCoord => data[alnCoord] || 0);
    return result;
  }.property('structureData',
	     'selectedTimepointIdx',
	     'timepointNames.length',
	     'model.coordinates.refToFirstAlnCoords'),

  selectedReferencePositions: function() {
    let alnPosns = this.get('model.sequences.selectedPositions');
    let alnToRef = this.get('model.coordinates.alnToRefCoords');
    let result = _.map(alnPosns, i => alnToRef[i]);
    return _.uniq(result);
  }.property('model.sequences.selectedPositions',
	     'model.coordinates.alnToRefCoords'),

  structureDataRange: function() {
    let data = this.get('structureData');
    let minval = d3.min(data, d => d3.min(d));
    let maxval = d3.max(data, d => d3.max(d));
    if (minval < 0 && maxval > 0) {
      let r = Math.max(Math.abs(minval), maxval);
      minval = -r;
      maxval = r;
    }
    return [minval, maxval];
  }.property('structureData'),

  timepoints: function() {
    if (this.get('selectedMetric') === "JS Divergence") {
      let divergence = this.get('model.divergence.sortedDivergence');
      return divergence.map(elt => elt.date);
    }
    let sorted = this.get('model.rates.sortedRates');
    let result = sorted.map(d => d.date);
    return result;
  }.property('model.rates.sortedRates.[].[]', 'selectedMetric'),

  timepointNames: function() {
    let timepoints = this.get('timepoints');
    let datemap = this.get('model.dates');
    let names = timepoints.map(function(name) {
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

  ticks: function() {
    let n = this.get('timepointNames.length');
    return _.range(n);
  }.property('timepointNames.length'),

  selectedName: function() {
    return this.get('timepointNames')[this.get('selectedTimepointIdx')];
  }.property('timepointNames', 'selectedTimepointIdx'),

  positions: function() {
    if (this.get('markPositive')) {
      return this.get('model.rates.positiveSelection');
    }
    return [];
  }.property('markPositive', 'model.rates.positiveSelection'),

  actions: {
    selectMetric: function(value) {
      if (value != null) {
        this.set('selectedMetric', value);
      }
    },
  }
});
