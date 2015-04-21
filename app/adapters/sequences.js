import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

export default Ember.Object.extend({
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
    var url = config.baseURL + 'data/' + session_id + '/sequences';
    return request(url).then(function(result) {
      var sequences = [];
      for (let prop in result) {
        if (!result.hasOwnProperty(prop)) {
          continue;
        }
        if (prop === "MRCA") {
          sequences.push(make_seq("mrca", null, result[prop], "MRCA"));
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
            var final = make_seq(id, date, seq, type);
            sequences.push(final);
          }
        }
      }
      return sequences;
    });
  }
});



// TODO: do not encode copy number in name
var copy_re = /_([0-9]+)$/;

function copyNumber(name) {
  var cpn = copy_re.exec(name);
  if (cpn) {
    return parseInt(cpn[1]);
  } else {
    return 1;
  }
}

function make_seq(id, date, sequence, type) {
  // FIXME: null dates are a problem everywhere!
  if (date !== null) {
    date = parse_date(date);
  }
  return Ember.Object.create({
    id: id,
    date: date,
    copyNumber: copyNumber(id),
    sequence: sequence,
    type: type,
    selected: true  // used to filter sequences
  });
}
