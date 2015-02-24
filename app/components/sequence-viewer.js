import Ember from 'ember';
import {format_date} from '../utils/utils';

export default Ember.Component.extend({

  // bound to controller
  inputSequences: [],
  refCoords: null,
  rangeStart: 1,
  rangeStop: 1,

  transformCoord: function(coord) {
    // transform from 1-index reference coordinate to 1-index alignment coordinate
    var refCoords = this.get('refCoords');
    if (refCoords[refCoords.length - 1] < coord) {
      // so we can see insertions after reference
      return refCoords.length;
    }
    var idx = refCoords.indexOf(coord);
    if (idx === -1) {
      //find first larger index
      for (idx = 0; idx < refCoords.length; idx++) {
        if (refCoords[idx] > coord) {
          break;
        }
      }
    }
    return idx + 1;  // convert from 0-index to 1-index
  },

  alnStart: function() {
    return this.transformCoord(this.get('rangeStart'));
  }.property('refCoords', 'rangeStart'),

  alnStop: function() {
    return this.transformCoord(this.get('rangeStop'));
  }.property('refCoords', 'rangeStop'),

  refHTML: function() {
    var coordinates = ["","",""];
    var selected_string = "";
    var last_hs = -5;
    var ref_map = this.get('refCoords');
    var positive_selection = this.get('positiveSelection');
    // TODO: there is surely a more elegent way of building this html
    for (var s = this.get('alnStart'); s <= this.get('alnStop'); s++) {
      var hs = ref_map[s - 1];  // convert to 0-index
      var str = "";
      if (hs < 10) {
        str = "  " + hs;
      } else {
        if (hs < 100) {
          str = " " + hs;
        } else {
          str = "" + hs;
        }
      }
      // if (this.get('markPositive')) {
      //   selected_string += (positive_selection['combined'].indexOf (s)>=0) ? "+" : "&nbsp;";
      // }
      if (last_hs === hs) {
        str = "INS";
      }
      coordinates[0] += "<span class = '_seq_hover_seq' data-coord = '" + s +"'>" + (str[0] === " " ? "&nbsp;" : str[0]) + "</span>";
      coordinates[1] += "<span class = '_seq_hover_seq' data-coord = '" + s +"'>" + (str[1] === " " ? "&nbsp;" : str[1]) + "</span>";
      coordinates[2] += "<span class = '_seq_hover_seq' data-coord = '" + s +"'>" + (str[2] === " " ? "&nbsp;" : str[2]) + "</span>";
      last_hs = hs;
    }
    var show_selected = false;
    return coordinates[0] + "<br/>" + coordinates[1] + "<br/>" + coordinates[2] + (show_selected ? "<br/>" + selected_string : "");
    }.property('alnStart', 'alnStop', 'refCoords', 'markPositive', 'positiveSelection'),

  mrcaSlice: function() {
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    // convert 1-indexed [start, stop] to 0-indexed [start, stop)
    return this.get('mrca').sequence.slice(start - 1, stop);
  }.property('alnStart', 'alnStop', 'inputSequence.@each'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('inputSequences');
    var result = [];
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    var mrca = this.get('mrcaSlice');
    var mask = this.get('maskUnchanged');
    var grouped = _.groupBy(sequences, function(s) {
      return s.get('date');
    });
    var process = function(s) {
      // convert 1-indexed [start, stop] to 0-indexed [start, stop)
      var result = s.sequence.slice(start - 1, stop);
      if (mask) {
        result = result.split('').map(function(aa, idx) {
          return aa === mrca[idx] ? '.' : aa;
        }).join('');
      }
      return {sequence: result,
              copyNumber: s.copyNumber,
              ids: [s.id]};
    };
    for (var key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      var final_seqs = grouped[key].map(process);
      if (this.get('collapseSeqs')) {
        final_seqs = collapse(final_seqs);
      }
      result.push({'date': format_date(new Date(key)),
                   'sequences': final_seqs});
    }
    result.sort();
    return addPercent(result);
  }.property('alnStart', 'alnStop', 'mrcaSlice',
             'inputSequence.@each', 'inputSequences.length',
             'maskUnchanged', 'collapseSeqs')
});


function collapse(seqs) {
  var groups = _.groupBy(seqs, function(s) {
    return s.sequence;
  });
  var result = [];
  for (var key in groups) {
    if (!groups.hasOwnProperty(key)) {
      continue;
    }
    result.push({
      sequence: groups[key][0].sequence,
      ids: groups[key].map(function(s) { return s.ids[0]; }),
      copyNumber: _.reduce(groups[key].map(function(s) { return s.copyNumber; }),
                           function(a, b) { return a + b; },
                           0)
    });
  }
  result.sort(function(a, b) {
    return b.copyNumber - a.copyNumber;
  });
  return result;
}


function addPercent(groups) {
  for (var i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    var total = _.reduce(seqs.map(function(s) { return s.copyNumber; }),
                         function(a, b) { return a + b; },
                         0);
    for (var j=0; j<seqs.length; j++) {
      seqs[j].percent = 100 * seqs[j].copyNumber / total;
    }
  }
  return groups;
}
