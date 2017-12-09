import Ember from 'ember';

import { computed, observes, action } from 'ember-decorators/object';
import { conditional, eq, array } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';

import config from '../../../config/environment';
import {maybe_parse_date, isString, mapIfPresent} from 'flea-web-app/utils/utils';

export default Ember.Controller.extend({

  showMarkPositive: config.fleaMode,
  markPositive: true,
  highlightMissing: false,
  labelCoordinates: false,

  // TODO: do not use two-way binding with slider.
  // TODO: when metric changes, this index might be invalid
  selectedTimepointIdx: 0,
  selectedMetricIdx: 0,

  application: Ember.inject.controller(),
  session: Ember.inject.controller(),

  @computed('application.rootURL',
            'application.currentPath',
            'session.session_id')
  currentPath(base, path, session_id) {
    path = path.replace('session', session_id).replace('.', '/');
    return base + path;
  },

  @computed('model.proteinMetrics.data.[]')
  orderedMetrics(metrics) {
    let single = metrics['single'];
    let paired = metrics['paired'] || [];
    let result = R.concat(single, paired);
    for (let i=0; i<result.length; i++) {
      result[i]["index"] = i;
    }
    return result
  },

  @computed('orderedMetrics')
  metricNames(metrics) {
    return R.pluck('name', metrics);
  },

  @computed('orderedMetrics',
	    'selectedMetricIdx')
  selectedMetric(metrics, idx) {
    return metrics[idx] || {};
  },

  @computed('selectedMetric')
  plotLabels(metric) {
    if (metric['paired']) {
      return R.pluck('name', metric['data']);
    } else {
      return [metric['name']];
    }
  },

  @computed('selectedMetric', 'timepoints')
  data1(metric, timepoints) {
    // stack into array of arrays, which is what time component expects
    let data = [];
    if (metric['paired']) {
      data = metric['data'][0]['data'];
    } else {
      data = metric['data'];
    }
    let sorted = R.map(k => R.find(x => maybe_parse_date(x.date).toString() === k.toString(), data), timepoints);
    return R.pluck('values', sorted);
  },

  @computed('selectedMetric', 'timepoints')
  data2(metric, timepoints) {
    if (metric['paired']) {
      let data = metric['data'][1]['data'];
      let sorted = R.map(k => R.find(x => maybe_parse_date(x.date).toString() === k.toString(), data), timepoints)
      return R.pluck('values', sorted);
    } else {
      return [];
    }
  },

  @computed('data1', 'data2')
  structureData(data1, data2) {
    if (data2.length > 0) {
      let result = [];
      let f = (x, y) => Math.log(x) - Math.log(y);
      let g = R.zipWith(f)
      return R.zipWith(g, data1, data2);
    } else {
      return data1;
    }
  },

  @computed('structureData',
	    'selectedTimepointIdx',
	    'model.coordinates.refToFirstAlnCoords')
  selectedStructureData(structureData, idx, coordMap) {
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

  @computed('model.sequences.selectedPositions',
	    'model.coordinates.alnToRefCoords')
  selectedReferencePositions(alnPosns, alnToRef) {
    let result = R.map(i => alnToRef[i], alnPosns);
    return R.uniq(result);
  },
  
  @computed('model.dates.sortedDates')
  timepoints(dates) {
    dates = R.map(R.identity, dates);
    dates.unshift('Combined');
    return dates;
  },

  @computed('model.dates.sortedVisitCodes')
  timepointNames(labels) {
    labels = R.map(R.identity, labels);
    labels.unshift('Combined');
    return labels;
  },

  selectedTimepointName: array.objectAt('timepointNames', 'selectedTimepointIdx'),

  @computed('model.proteinMetrics.positiveSelection', 'timepoints', 'markPositive')
  positiveSelectionPositions(dateToPosns, timepoints, markPositive) {
    if (!markPositive || R.isEmpty(dateToPosns)) {
      return R.map(_ => [], timepoints);
    }
    return R.map(t => dateToPosns[t], timepoints);
  },

  @computed('timepointNames.length')
  ticks(n) {
    return R.range(0, n);
  }

});
