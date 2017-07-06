import Ember from 'ember';
import config from '../config/environment';
import {parse_date} from 'flea-app/utils/utils';

import SequenceObject from 'flea-app/models/sequence-object';
import SequencesObject from 'flea-app/models/sequences-object';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  /* formats sequences to flat format:

     [{ id: "mrca",
        date: new Date(),
        sequence: "ACGT",
      }
      { etc... }
    ]
  */

  find: function(session_id) {
    let url = config.rootURL + 'data/' + session_id + '/sequences';
    return this.get("ajax").request(url).then(function(result) {
      let observed = [];
      let ancestors = [];
      let reference = null;
      let mrca = null;
      for (let prop in result) {
        if (!result.hasOwnProperty(prop)) {
          continue;
        }
        if (prop === "MRCA") {
          mrca = make_seq("mrca", null, result[prop]);
          continue;
        }
        if (prop === "Reference") {
          reference = make_seq("reference", null, result[prop]);
          continue;
        }
        if (prop === "Ancestors") {
	  let ancestors_json = result['Ancestors'];
          for (let id in ancestors_json) {
	    if (!ancestors_json.hasOwnProperty(id)) {
	      continue;
	    }
	    let seq = ancestors_json[id];
	    let fseq = make_seq(id, null, seq);
	    ancestors.push(fseq);
          }
        }
	if (prop === "Observed") {
	  let observed_json = result['Observed'];
	  for (let date in observed_json) {
            if (!observed_json.hasOwnProperty(date)) {
              continue;
            }
            let timepoint = observed_json[date];
            for (let id in timepoint) {
	      if (!timepoint.hasOwnProperty(id)) {
		continue;
	      }
	      let seq = timepoint[id];
	      let fseq = make_seq(id, date, seq);
	      observed.push(fseq);
            }
	  }
	} else {
	  // old-style json. assume the key is a date.
	  let date = prop
	  if (result[date].hasOwnProperty("Observed")) {
            let timepoint = result[date]["Observed"];
            for (let id in timepoint) {
	      if (!timepoint.hasOwnProperty(id)) {
		continue;
	      }
	      let seq = timepoint[id];
	      let fseq = make_seq(id, date, seq);
	      observed.push(fseq);
            }
	  }
	}
      }
      return SequencesObject.create({
        reference: reference,
        mrca: mrca,
        observed: observed,
        ancestors: ancestors,
      });
    });
  }
});


function make_seq(id, date, sequence) {
  // FIXME: null dates are a problem everywhere!
  if (date !== null) {
    date = parse_date(date);
  }
  return SequenceObject.create({
    id: id,
    date: date,
    sequence: sequence,
  });
}
