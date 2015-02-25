import Ember from 'ember';
import {format_date, htmlTable1D, regexRanges} from '../utils/utils';

export default Ember.Component.extend({

  // bound to controller
  inputSequences: [],
  refCoords: null,
  rangeStart: 1,
  rangeStop: 1,
  selectedPositions: new Ember.Set(),

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
    var coordinates = [[], [], [], []];
    var last_hs = -5;
    var ref_map = this.get('refCoords');
    // TODO: there is surely a more elegent way of building this html
    for (var s = this.get('alnStart'); s <= this.get('alnStop'); s++) {
      var hs = ref_map[s - 1];  // convert to 0-index
      var str = "";
      if (hs < 10) {
        str = "&nbsp&nbsp" + hs;
      } else {
        if (hs < 100) {
          str = "&nbsp" + hs;
        } else {
          str = "" + hs;
        }
      }
      if (last_hs === hs) {
        str = "INS";
      }
      var _class = '';
      if (this.get('selectedPositions').contains(s)) {
        _class = 'selected_position';
      }
      coordinates[0].push({character: str[0], _class: _class, dataCoord: s});
      coordinates[1].push({character: str[1], _class: _class, dataCoord: s});
      coordinates[2].push({character: str[2], _class: _class, dataCoord: s});
      if (this.get('markPositive')) {
        coordinates[3].push({character: (this.get('positiveSelection')[0].indexOf(s) >= 0) ? "+" : "&nbsp",
                             dataCoord: s});
      }
      last_hs = hs;
    }
    return coordinates;
  }.property('alnStart', 'alnStop', 'refCoords', 'markPositive', 'positiveSelection', 'selectedPositions', 'selectedPositions.[]'),

  mrcaSlice: function() {
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    // convert 1-indexed [start, stop] to 0-indexed [start, stop)
    return this.get('mrca').sequence.slice(start - 1, stop);
  }.property('alnStart', 'alnStop'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('inputSequences');
    var result = [];
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    var mrca = this.get('mrcaSlice');
    var grouped = _.groupBy(sequences, function(s) {
      return s.get('date');
    });
    var process = function(s) {
      // convert 1-indexed [start, stop] to 0-indexed [start, stop)
      var result = s.sequence.slice(start - 1, stop);
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
      final_seqs.sort(function(a, b) {
        return b.copyNumber - a.copyNumber;
      });
      result.push({'date': format_date(new Date(key)),
                   'sequences': final_seqs});
    }
    result.sort();
    result = addPercent(result);
    result = addHTML(result);
    result = addHighlights(result, this.get('regex'));
    if (this.get('maskUnchanged')) {
      result = addMask(result, mrca);
    }
    return result;
  }.property('alnStart', 'alnStop', 'mrcaSlice',
             'inputSequences.@each',
             'maskUnchanged', 'collapseSeqs', 'regex'),

  actions: {
    togglePosition: function(pos) {
      pos = +pos;
      if (this.get('selectedPositions').contains(pos)) {
        this.get('selectedPositions').remove(pos);
      } else {
        this.get('selectedPositions').add(pos);
      }
      console.log(this.get('selectedPositions').toArray());
    },
    clearPositions: function() {
      this.get('selectedPositions').clear();
    },
    selectAllPositive: function () {
      var positions = this.get('positiveSelection')[0];
      var start = this.get('alnStart');
      var stop = this.get('alnStop');
      var result = new Ember.Set();
      for (var i = 0; i < positions.length; i++) {
        // could do binary search to speed this up
        var pos = positions[i];
        if (start <= pos && pos <= stop) {
          result.add(pos);
        }
        if (pos > stop) {
          break;
        }
      }
      this.set('selectedPositions', result);
    }
  }
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
    var group = groups[key];
    var ids = [];
    var number = 0;
    for (var i=0; i<group.length; i++) {
      ids.push(group[i].ids[0]);
      number += group[i].copyNumber;
    }
    result.push({
      sequence: group[0].sequence,
      ids: ids,
      copyNumber: number
    });
  }
  return result;
}


function addPercent(groups) {
  for (var i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    var total = 0;
    for (var j=0; j<seqs.length; j++) {
      total += seqs[j].copyNumber;
    }
    for (var k=0; k<seqs.length; k++) {
      seqs[k].percent = 100 * seqs[k].copyNumber / total;
    }
  }
  return groups;
}


function addHTML(groups) {
  for (var i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (var j=0; j<seqs.length; j++) {
      seqs[j].html = htmlTable1D(seqs[j].ids, ['Sequence ID']);
    }
  }
  return groups;
}


function addHighlights(groups, regex) {
  for (var i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (var j=0; j<seqs.length; j++) {
      seqs[j].highlights = regexRanges(regex, seqs[j].sequence);
    }
  }
  return groups;
}

function addMask(groups, mrca) {
  for (var i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (var j=0; j<seqs.length; j++) {
      var seq = seqs[j];
      seqs[j].sequence = seq.sequence.split('').map(function(aa, idx) {
        return aa === mrca[idx] ? '.' : aa;
      }).join('');
    }
  }
  return groups;
}
