import Ember from 'ember';
import {parse_date, isString, mapIfPresent} from 'flea-app/utils/utils';
import { computed, observes, action } from 'ember-decorators/object';
import { conditional, eq, array } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';

export default Ember.Controller.extend({

  _metrics: ["JS Divergence", "dNdS", "Entropy"],
  selectedMetric: "JS Divergence",

  markPositive: true,
  labelCoordinates: false,

  emptyArray: [],

  // TODO: do not use two-way binding with slider.
  // TODO: when metric changes, this index might be invalid
  selectedTimepointIdx: 0,

  application: Ember.inject.controller(),
  session: Ember.inject.controller(),

  @computed('application.rootURL',
            'application.currentPath',
            'session.session_id')
  currentPath(base, path, session_id) {
    path = path.replace('session', session_id).replace('.', '/');
    return base + path;
  },

  @computed('model.rates.exists', '_metrics')
  metrics(exists, metrics) {
    return exists ? metrics : ["JS Divergence"];
  },

  @computed('selectedMetric')
  labels(metric) {
    return metric === "dNdS" ? ['Mean dS', 'Mean dN'] : [metric]
  },

  getRate(data, idx) {
    return data.map(d => d.rates.map(r => r[idx]));
  },

  @computed('model.rates.sortedRates.[]')
  meanDS(rates) {
    return this.getRate(rates, 0);
  },

  @computed('model.rates.sortedRates.[]')
  meanDN(rates) {
    return this.getRate(rates, 1);
  },

  @computed('model.rates.sortedRates.[]')
  entropy(rates) {
    return this.getRate(rates, 4);
  },

  @computed('model.divergence.sortedDivergence')
  divergence(divergence) {
    return divergence.map(elt => elt.divergence);
  },

  @computed('selectedMetric', 'divergence', 'entropy', 'meanDS')
  data1(metric, divergence, entropy, meanDS) {
    if (metric === "Entropy") {
      return entropy;
    }
    else if (metric === "JS Divergence") {
      return divergence;
    }
    else if (metric === "dNdS") {
      return meanDS;
    }
    throw "Invalid metric";
  },

  data2: conditional(eq('selectedMetric', raw('dNdS')), 'meanDN', 'emptyArray'),

  @computed('selectedMetric',
	    'entropy', 'divergence', 'meanDN', 'meanDS')
  structureData(metric, entropy, divergence, meanDN, meanDS, map) {
    if (metric === "Entropy") {
      return entropy;
    }
    if (metric === "JS Divergence") {
      return divergence;
    }
    if (metric === 'dNdS') {
      let result = [];
      for (let idx=0; idx<meanDN.length; idx++) {
        let zipped = R.zip(meanDN[idx], meanDS[idx]);
        let logratios = zipped.map(pair => Math.log(pair[0] / pair[1]));
        result.push(logratios);
      }
      return result;
    }
    throw {name: 'UnknownMetricError', message: metric};
  },

  @computed('selectedTimepointIdx', 'structureData',
	    'model.coordinates.refToFirstAlnCoords')
  selectedStructureData(idx, structureData, coordMap) {
    // map data onto reference coordinates
    // we expect the pdb structure to contain reference coordinates
    // for the residues.
    let data = structureData[idx];
    if (!data) {
      return null;
    }
    let result = R.map(alnCoord => data[alnCoord] || 0, coordMap);
    return result;
  },

  @computed('model.sequences.selectedPositions',
	    'model.coordinates.alnToRefCoords')
  selectedReferencePositions(alnPosns, alnToRef) {
    let result = R.map(i => alnToRef[i], alnPosns);
    return R.uniq(result);
  },

  @computed('structureData')
  structureDataRange(data) {
    let minval = d3.min(data, d => d3.min(d));
    let maxval = d3.max(data, d => d3.max(d));
    if (minval < 0 && maxval > 0) {
      let r = Math.max(Math.abs(minval), maxval);
      minval = -r;
      maxval = r;
    }
    return [minval, maxval];
  },

  @computed('model.divergence.sortedDivergence.[]')
  timepoints(divergence) {
    return divergence.map(elt => elt.date);
  },

  @computed('timepoints.[]', 'model.dates')
  timepointNames(timepoints, datemap) {
    let names = timepoints.map(name => {
      if (name === 'Combined') {
        return name;
      }
      if(isString(name)) {
        name = parse_date(name);
      }
      return mapIfPresent(datemap, name);
    });
    return names;
  },

  @computed('timepointNames.length')
  ticks(n) {
    return R.range(0, n);
  },

  selectedName: array.objectAt('timepointNames', 'selectedTimepointIdx'),
  positions: conditional('markPositive', 'model.rates.positiveSelection', 'emptyArray'),

  @action
  selectMetric(value) {
    if (value != null) {
      this.set('selectedMetric', value);
    }
  }
});
