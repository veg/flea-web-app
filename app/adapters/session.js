import Ember from 'ember';
import config from '../config/environment';

import { computed, observes, action } from 'ember-decorators/object';

import CoordinatesObject from 'flea-app/models/coordinates-object';
import SequenceObject from 'flea-app/models/sequence-object';
import SequencesObject from 'flea-app/models/sequences-object';
import DatesObject from 'flea-app/models/dates-object';
import { parse_date, maybe_parse_date } from 'flea-app/utils/utils';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    let url = config.apiURL + 'sessions/' + session_id;
    return this.get("ajax").request(url).then(function(json) {
      json['coordinates'] = CoordinatesObject.create({data: json['coordinates']})
      json['dates'] = DatesObject.create({dates: R.map(d => {
	return {
	  name: d.name,
	  date: parse_date(d.date)
	};
      }, json['dates'])});
      
      json['sequences'] = parseSequences(json),

      json['proteinMetrics'] = ProteinMetricsObject.create({
	data: json['protein_metrics'],
      });
      delete json['protein_metrics'];

      json['pdb'] = pv.io.pdb(json['pdb'].join('\n'));

      json['predefinedRegions'] = R.map(x => {
	// convert to 0-indexed [start, stop)
	return {
	  name: x.name,
	  start: x.start - 1,
	  stop: x.stop
	};
      }, json['predefined_regions']),
      delete json['predefined_regions'];

      if (config.fleaMode) {
	json['regionMetrics'] = json['region_metrics'];
	delete json['region_metrics'];
      }
      return json;
    });
  }
});

function parseSequences(json) {
  let reference = make_seq("mrca", json['reference']);
  let mrca = make_seq("mrca", json['mrca']);
  let ancestors = R.map(s => make_seq(s.name, s.sequence), json['sequences'])
  let observed = R.map(s => make_seq(s.name, s.sequence, parse_date(s.date),
				     s.copynumber, s.x, s.y),
		       json['sequences'])
  return SequencesObject.create({
    reference: reference,
    mrca: mrca,
    observed: observed,
    ancestors: ancestors,
  });
}

function make_seq(name, sequence, date, copynumber, x, y) {
  return SequenceObject.create({
    name: name,
    sequence: sequence,
    date: date,
    copynumber: copynumber,
    x: x,
    y: y
  });
}

let ProteinMetricsObject = Ember.Object.extend({
  data: [],
  selectionThreshold: 0.95,

  @computed('data.[]', 'selectionThreshold')
  positiveSelection(data, threshold) {
    let dnds = R.find(R.propEq('name', 'dNdS'), data['paired']);
    if (!dnds) {
      return {};
    }
    let dN = R.find(R.propEq('name', 'Mean dN'), dnds['data']);
    let result = {};
    R.forEach(timepoint => {
      let date = maybe_parse_date(timepoint['date']);
      let values = timepoint['values'];
      let indices = R.filter(i => values[i] > threshold,
			     R.range(0, values.length))
      result[date] = indices;
    }, dN['data']);
    return result;
  }
});
