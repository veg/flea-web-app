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
        type: "Ancestor" | "Observed" | "MRCA" | "Combined"
      }
      { etc... }
    ]
  */

  find: function(session_id) {
    var url = config.rootURL + 'data/' + session_id + '/sequences';
    return this.get("ajax").request(url).then(function(result) {
      var sequences = [];
      var reference = null;
      var mrca = null;
      for (let prop in result) {
        if (!result.hasOwnProperty(prop)) {
          continue;
        }
        if (prop === "MRCA") {
          mrca = make_seq("mrca", null, result[prop], "MRCA");
          continue;
        }
        if (prop === "Reference") {
          reference = make_seq("reference", null, result[prop], "Reference");
          continue;
        }
        if (prop === "Combined") {
          var combined = result[prop];
          for (let cid in combined) {
            if (!combined.hasOwnProperty(cid)) {
              continue;
            }
            var cseq = combined[cid];
            var cfinal = make_seq(cid, null, cseq, "Combined");
            sequences.push(cfinal);
          }
          continue;
        }
        var date = prop;
        var timepoint = result[prop];
        for (let type in timepoint) {
          if (!timepoint.hasOwnProperty(type)) {
            continue;
          }
          var seqs = timepoint[type];
          for (let id in seqs) {
            if (!seqs.hasOwnProperty(id)) {
              continue;
            }
            var seq = seqs[id];
            var fseq = make_seq(id, date, seq, type);
            sequences.push(fseq);
            continue;
          }
        }
      }
      return SequencesObject.create({
        sequences: sequences,
        mrca: mrca,
        reference: reference
      });
    });
  }
});


function make_seq(id, date, sequence, type) {
  // FIXME: null dates are a problem everywhere!
  if (date !== null) {
    date = parse_date(date);
  }
  return SequenceObject.create({
    id: id,
    date: date,
    sequence: sequence,
    type: type,
  });
}
