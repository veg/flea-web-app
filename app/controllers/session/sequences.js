import Ember from 'ember';
import {format_date, htmlTable1D, regexRanges, transformIndex} from '../../utils/utils';


var pngsRegex = 'N\\-*[^P-]\\-*[ST]\\-*[^P-]';


export default Ember.ObjectController.extend({

  // set by selector component
  _selectedSequences: [],

  // set from _selectedSequences in finalizeSelection action
  selectedSequences: 'empty',

  // TODO: maybe these should be in a View instead
  // range in hxb2 1-indexed coordinates
  ranges: [[160, 200]],
  minCoord: 1,

  regexValue: pngsRegex,
  regexDefault: pngsRegex,
  _regex: '',

  markPositive: true,

  // in alignment 1-indexed coordinates
  selectedPositions: new Ember.Set(),

  regex: function() {
    var value = this.get('regexValue');
    if (value.length === 0) {
      return ".^";
    }
    try {
      new RegExp(value, 'g');
      this.set('_regex', value);
    } catch(err) {
    }
    return this.get('_regex');
  }.property('regexValue'),

  // TODO: do not hard-code
  predefinedRegions: [
    {name: 'V1', start: 131, stop: 156},
    {name: 'V2', start: 157, stop: 196},
    {name: 'V3', start: 296, stop: 330},
    {name: 'V4', start: 385, stop: 418},
    {name: 'V5', start: 461, stop: 471},
    {name: 'MPER', start: 662, stop: 683}
  ],

  maxCoord: function() {
    // maximum reference coordinate
    return this.get('model.frequencies.refToLastAlnCoords').length;
  }.property('model.frequencies.refToLastAlnCoords.length'),

  maxAlnCoord: function() {
    // maximum reference coordinate
    return this.get('model.frequencies.alnToRefCoords').length;
  }.property('model.frequencies.alnToRefCoords.length'),

  filterSequenceTypes: function(seqs, type) {
    return seqs.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  observedSequences: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'Observed');
  }.property('model.sequences.@each'),

  mrca: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'MRCA')[0];
  }.property('model.sequences.@each'),

  toSlices: function(seq, ranges) {
    return ranges.map(function(range) {
      return seq.slice(range[0] - 1, range[1]);
    }).join('|');
  },

  mrcaSlice: function() {
    var mrca = this.get('mrca');
    var ranges = this.get('alnRanges');
    return this.toSlices(mrca.sequence, ranges);
  }.property('mrca', 'alnRanges'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('selectedSequences');
    if (sequences === 'empty') {
      sequences = this.get('observedSequences');
    }
    var result = [];
    var ranges = this.get('alnRanges');
    var mrca = this.get('mrcaSlice');
    var grouped = _.groupBy(sequences, function(s) {
      return s.get('date');
    });
    var slice = function(s) {
      var result = self.toSlices(s.sequence, ranges);
      return {sequence: result,
              copyNumber: s.copyNumber,
              ids: [s.id]};
    };
    for (var key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      var final_seqs = grouped[key].map(slice);
      final_seqs = collapse(final_seqs);
      final_seqs.sort(function(a, b) {
        return b.copyNumber - a.copyNumber;
      });
      result.push({'date': new Date(key),
                   'sequences': final_seqs});
    }
    result.sort(function(a, b) {return a.date - b.date;});
    result.forEach(function(elt) {
      elt.date = format_date(elt.date);
    });
    result = addPercent(result);
    result = addHTML(result);
    result = addHighlights(result, this.get('regex'));
    result = addMask(result, mrca);
    return result;
  }.property('alnRanges', 'mrcaSlice',
             'selectedSequences.@each',
             'regex'),

  alnRanges: function() {
    // 1-indexed [start, stop] reference ranges to
    // 1-indexed [start, stop] aligment ranges
    var ranges = this.get('ranges');
    this.checkRanges(ranges, this.get('maxCoord'));
    var mapFirst = this.get('model.frequencies.refToFirstAlnCoords');
    var mapLast = this.get('model.frequencies.refToLastAlnCoords');
    var result = ranges.map(function(range) {
      var start = transformIndex(range[0], mapFirst);
      var stop = transformIndex(range[1], mapLast);
      return [start, stop];
    });
    this.checkRanges(result, this.get('maxAlnCoord'));
    return result;
  }.property('ranges',
             'model.frequencies.refToFirstAlnCoords',
             'model.frequencies.refToLastAlnCoords'),

  aaTrajectories: function() {
    var sequences = this.get('selectedSequences');
    if (sequences === 'empty') {
      sequences = this.get('observedSequences');
    }
    var positions = this.get('selectedPositions').toArray().sort(function(a, b) {return (a - b);});
    if (positions.length === 0) {
      return [];
    }
    var counts = {};
    var totals = {};
    for (var i=0; i<sequences.length; i++ ) {
      var seq = sequences[i];
      var motif = positions.map(function(idx) {
        return seq.sequence[idx - 1];  // 1-indexed
      }).join('');
      if (!(counts.hasOwnProperty(motif))) {
        counts[motif] = {};
      }
      if (!(counts[motif].hasOwnProperty(seq.date))) {
        counts[motif][seq.date] = 0;
      }
      counts[motif][seq.date] += seq.copyNumber;
      if (!(totals.hasOwnProperty(seq.date))) {
        totals[seq.date] = 0;
      }
      totals[seq.date] += seq.copyNumber;
    }
    var series = [];
    for (var m in counts) {
      if (!(counts.hasOwnProperty(m))) {
        continue;
      }
      var points = [];
      for (var date in totals) {
        if (!(totals.hasOwnProperty(date))) {
          continue;
        }
        var frac = 0;
        if (counts[m].hasOwnProperty(date)) {
          frac = counts[m][date] / totals[date];
        }
        points.push({x: new Date(date), y: frac});
      }
      series.push({name: m, values: points});
    }
    // take top 9 and combine others
    if (series.length > 10) {
      var maxes = [];
      for (var j=0; j<series.length; j++) {
        var trajectory = series[j];
        var tmax = _.max(trajectory.values.map(function(v) { return v.y; }));
        maxes.push({name: trajectory.name, max: tmax});
      }
      maxes.sort(function(a, b) { return b.max - a.max; });
      var split_names = _.partition(maxes.map(function(v) {return v.name;}),
                                    function(value, index) {return index < 9;});
      var top9 = split_names[0];
      var split_series = _.partition(series, function(elt) {return _.includes(top9, elt.name);});
      var first_series = split_series[0];
      var rest_series = split_series[1];
      // now combine others
      var combined = rest_series[0].values;
      for (var k=1; k<rest_series.length; k++) {
        var curve = rest_series[k].values;
        for (var n=0; n<curve.length; n++) {
          combined[n].y += curve[n].y;
        }
      }
      first_series.push({name: 'other', values: combined});
      series = first_series;
    }
    // TODO: sort by date each motif became prevalent
    return series;
  }.property('selectedPositions.[]', 'selectedSequences.@each'),

  checkRanges: function(ranges, maxCoord) {
    for (var i=0; i<ranges.length; i++) {
      this.checkRange(ranges[i], maxCoord);
    }
  },

  checkRange: function(range, maxCoord) {
    // check 1-indexed range against 1-indexed maximum coordinate
    var start = range[0];
    var stop = range[1];
    if (start < 1) {
      throw "invalid start position";
    }

    if (stop > maxCoord) {
      throw "invalid stop position";
    }
  },

  actions: {
    resetRegex: function() {
      this.set('regexValue', this.get('regexDefault'));
    },
    finalizeSelection: function() {
      this.set('selectedSequences', this.get('_selectedSequences'));
    },

    updateAlnRange: function(idx, range) {
      this.checkRange(range, this.get('maxAlnCoord'));

      var alnRanges = this.get('alnRanges');
      var map = this.get('model.frequencies.alnToRefCoords');
      var refRanges = this.get('ranges');

      // shallow copy, so we have a different object. Ensures that
      // calling this.set() triggers computed properties.
      var result = refRanges.slice(0);
      result[idx] = [map[range[0]], map[range[1]]];
      this.set('ranges', result);
    }
  }
});


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
      seqs[j].mask = seq.sequence.split('').map(function(aa, idx) {
        return aa === mrca[idx];
      });
    }
  }
  return groups;
}
