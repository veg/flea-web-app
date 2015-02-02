import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  /* formats sequences to flat format:

     [{ id: "mrca",
        date: new Date(),
        sequence: "ACGT",
        type: "Ancestor" | "Observed" | "MRCA"
      }
      { etc... }
    ]
  */

  find: function() {
    return request('/api/sequences').then(function(result) {
      var sequences = [];
      for (var prop in result) {
        if (!result.hasOwnProperty(prop)) {
          continue;
        }
        if (prop === "MRCA") {
          sequences.push(make_seq("mrca", null, result[prop], "MRCA"));
          continue;
        }
        if (prop === "Combined") {
          var combined = result[prop];
          for (var cid in combined) {
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
        for (var type in timepoint) {
          if (!timepoint.hasOwnProperty(type)) {
            continue;
          }
          var seqs = timepoint[type];
          for (var id in seqs) {
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


var parse_date = d3.time.format("%Y%m%d");


function make_seq(id, date, sequence, type) {
  if (date !== null) {
    date = parse_date.parse(date);
  }
  return {id: id,
          date: date,
          sequence: sequence,
          type: type};
}
