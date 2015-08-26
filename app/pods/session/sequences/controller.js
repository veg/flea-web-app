import Ember from 'ember';
import {format_date, htmlTable1D, regexRanges, transformIndex, checkRange, checkRanges} from 'flea-app/utils/utils';
import parser from 'flea-app/utils/parser';


var pngsPattern = 'N[^P][ST][^P]';


export default Ember.Controller.extend({

  // set by selector component
  _selectedSequences: [],

  // set from _selectedSequences in finalizeSelection action
  selectedSequences: 'empty',

  // range in 0-indexed [start, stop) reference coordinates
  ranges: [[159, 200]],

  _pattern: pngsPattern,  // displayed in template
  pattern: pngsPattern,  // triggers actual update
  patternDefault: pngsPattern,
  _regex: '',  // cache latest valid regexp
  patternClass: 'input-valid',

  _threshold: 1,
  threshold: 1,

  markPositive: true,

  // in alignment 0-indexed coordinates
  selectedPositions: [],

  // parses simple grammar and builds RegExp that takes gaps and pipes
  // into account
  regex: function() {
    this.set('patternClass', 'input-valid');
    var value = this.get('pattern');
    if (value.length === 0) {
      return ".^";
    }
    try {
      var result = [];
      var parsed = parser.parse(value);
      for (let i=0; i<parsed.length; i++) {
        var part = parsed[i];
        if (part.type === "amino") {
          result.push(part.value + part.postmod);
        } else {
          var partvalue = part.value;
          if (part.premod === "^") {
            partvalue += "\|\-";
          }
          result.push("[" + part.premod + partvalue + "]" + part.postmod);
        }
      }
      result = result.join("-*");
      // try making a RegExp, so exception will get thrown if it fails
      new RegExp(result, 'g');
      this.set('_regex', result);
    } catch(err) {
      this.set('patternClass', 'input-invalid');
    }
    return this.get('_regex');
  }.property('pattern'),

  validAlnRange: function() {
    return [0, this.get('model.frequencies.alnToRefCoords.length')];
  }.property('model.frequencies.alnToRefCoords.length'),

  filterSequenceTypes: function(seqs, type) {
    return seqs.filter(function(seq) {
      return seq.get('type') === type;
    });
  },

  observedSequences: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'Observed');
  }.property('model.sequences.[]'),

  mrca: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'MRCA')[0];
  }.property('model.sequences.[]'),

  reference: function() {
    var seqs = this.get('model.sequences');
    if (!_.some(seqs, s => s.type === 'Reference')) {
      return '';
    }
    var ref = this.filterSequenceTypes(seqs, 'Reference')[0];
    // replace repeats with '-'
    var map = this.get('model.frequencies.alnToRefCoords');
    var newSeq = [ref.sequence[0]];
    for (var k=1; k<map.length; k++ ) {
      if (map[k] === map[k - 1]) {
        newSeq.push('-');
      } else {
        newSeq.push(ref.sequence[k]);
      }
    }
    ref.sequence = newSeq.join('');
    return ref;
  }.property('model.sequences.[]', 'model.frequencies.alnToRefCoords'),

  toSlices: function(seq, ranges) {
    return ranges.map(range => seq.slice(range[0], range[1])).join('|');
  },

  mrcaSlice: function() {
    var mrca = this.get('mrca');
    var ranges = this.get('alnRanges');
    return this.toSlices(mrca.sequence, ranges);
  }.property('mrca', 'alnRanges'),

  refSlice: function() {
    var ref = this.get('reference');
    if (ref.length === 0) {
      return "";
    }
    var ranges = this.get('alnRanges');
    return this.toSlices(ref.sequence, ranges);
  }.property('mrca', 'alnRanges'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('selectedSequences');
    if (sequences === 'empty') {
      sequences = this.get('observedSequences');
    }
    var copynumbers = this.get('model.copynumbers');
    var result = [];
    var ranges = this.get('alnRanges');
    var mrca = this.get('mrcaSlice');
    var grouped = _.groupBy(sequences, s => s.get('date'));
    var slice = function(s) {
      var result = self.toSlices(s.sequence, ranges);
      var cn = 0;
      if (s.id in copynumbers) {
        cn = copynumbers[s.id];
      }
      return {sequence: result,
              copyNumber: cn,
              ids: [s.id]};
    };
    for (let key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      var final_seqs = grouped[key].map(slice);
      final_seqs = collapse(final_seqs);
      final_seqs.sort((a, b) => b.copyNumber - a.copyNumber);
      result.push({'date': new Date(key),
                   'sequences': final_seqs});
    }
    result.sort((a, b) => a.date - b.date);
    result.forEach(function(elt) {
      elt.date = format_date(elt.date);
    });
    result = addPercent(result);
    result = filterPercent(result, this.get('threshold'));
    result = addHTML(result);
    result = addHighlights(result, this.get('regex'));
    result = addMask(result, mrca);
    return result;
  }.property('alnRanges', 'mrcaSlice',
             'model.copynumbers',
             'selectedSequences.[]',
             'regex', 'threshold'),

  sortedRanges: function() {
    var ranges = this.get('ranges');
    ranges.sort((a, b) => a[0] - b[0]);
    return ranges;
  }.property('ranges'),

  alnRanges: function() {
    // convert reference ranges to aligment ranges
    var ranges = this.get('sortedRanges');
    checkRanges(ranges, this.get('model.frequencies.refRange'));
    var mapFirst = this.get('model.frequencies.refToFirstAlnCoords');
    var mapLast = this.get('model.frequencies.refToLastAlnCoords');
    var result = ranges.map(function(range) {
      var start = transformIndex(range[0], mapFirst, false);
      var stop = transformIndex(range[1], mapLast, true);
      return [start, stop];
    });
    checkRanges(result, this.get('validAlnRange'));
    return result;
  }.property('ranges',
             'model.frequencies.refToFirstAlnCoords',
             'model.frequencies.refToLastAlnCoords'),

  aaTrajectories: function() {
    var sequences = this.get('selectedSequences');
    var copynumbers = this.get('model.copynumbers');
    if (sequences === 'empty') {
      sequences = this.get('observedSequences');
    }
    var positions = _.values(this.get('selectedPositions')).sort((a, b) => a - b);
    if (positions.length === 0) {
      return [];
    }
    var counts = {};
    var totals = {};
    for (let i=0; i<sequences.length; i++ ) {
      var seq = sequences[i];
      var motif = positions.map(idx => seq.sequence[idx]).join('');
      if (!(counts.hasOwnProperty(motif))) {
        counts[motif] = {};
      }
      if (!(counts[motif].hasOwnProperty(seq.date))) {
        counts[motif][seq.date] = 0;
      }
      counts[motif][seq.date] += copynumbers[seq.id];
      if (!(totals.hasOwnProperty(seq.date))) {
        totals[seq.date] = 0;
      }
      totals[seq.date] += copynumbers[seq.id];
    }
    var series = [];
    for (let m in counts) {
      if (!(counts.hasOwnProperty(m))) {
        continue;
      }
      var points = [];
      for (let date in totals) {
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
      for (let j=0; j<series.length; j++) {
        var trajectory = series[j];
        var tmax = _.max(trajectory.values.map(v => v.y));
        maxes.push({name: trajectory.name, max: tmax});
      }
      maxes.sort((a, b) => b.max - a.max);
      var split_names = _.partition(maxes.map(v => v.name),
                                    (value, index) => index < 9);
      var top9 = split_names[0];
      var split_series = _.partition(series, elt => _.includes(top9, elt.name));
      var first_series = split_series[0];
      var rest_series = split_series[1];
      // now combine others
      var combined = rest_series[0].values;
      for (let k=1; k<rest_series.length; k++) {
        var curve = rest_series[k].values;
        for (let n=0; n<curve.length; n++) {
          combined[n].y += curve[n].y;
        }
      }
      first_series.push({name: 'other', values: combined});
      series = first_series;
    }
    // TODO: sort by date each motif became prevalent
    return series;
  }.property('selectedPositions.[]', 'selectedSequences.[]'),

  validPredefinedRegions: function() {
    var [start, stop] = this.get('model.frequencies.refRange');
    var regions = this.get('model.predefinedRegions');
    return regions.filter(r => r.start >= start && r.stop <= stop);
  }.property('model.predefinedRegions', 'model.frequencies.refRange'),

  actions: {
    doPattern: function() {
      this.set('pattern', this.get('_pattern'));
    },

    doThreshold: function() {
      var t = this.get('_threshold');
      if (t === "") {
        t = 0;
      }
      t = +t;
      if (t >= 0 && t <= 100) {
        this.set('_threshold', t);
        this.set('threshold', t);
      }
    },

    resetPattern: function() {
      this.set('_pattern', this.get('patternDefault'));
      this.set('pattern', this.get('patternDefault'));
    },

    finalizeSelection: function() {
      this.set('selectedSequences', this.get('_selectedSequences'));
    },

    updateAlnRange: function(idx, range) {
      checkRange(range, this.get('validAlnRange'));
      var map = this.get('model.frequencies.alnToRefCoords');
      var refRanges = this.get('sortedRanges');

      // shallow copy, so we have a different object. Ensures that
      // calling this.set() triggers computed properties.
      var result = refRanges.slice(0);
      result[idx] = [transformIndex(range[0], map, false),
                     transformIndex(range[1], map, true)];
      result.sort((a, b) => a[0] - b[0]);
      this.set('ranges', result);
    },

    setRanges: function(ranges) {
      checkRanges(ranges, this.get('model.frequencies.refRange'));
      this.set('ranges', ranges);
    },

    addRange: function(range) {
      checkRange(range, this.get('model.frequencies.refRange'));
      var ranges = this.get('sortedRanges').slice(0);
      ranges.push(range);
      this.set('ranges', ranges);
    },

    rmRange: function(idx) {
      var ranges = this.get('sortedRanges');
      this.set('ranges', ranges.filter((elt, i) => i !== idx));
    },

    setSelectedPositions: function(positions) {
      var stop = this.get('validAlnRange')[1];
      if (positions && _.every(positions, p => (p >= 0 && p < stop))) {
        this.set('selectedPositions', positions);
      }
    }
  }
});


function addPercent(groups) {
  for (let i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    var total = 0;
    for (let j=0; j<seqs.length; j++) {
      total += seqs[j].copyNumber;
    }
    for (let k=0; k<seqs.length; k++) {
      seqs[k].percent = 100 * seqs[k].copyNumber / total;
    }
  }
  return groups;
}

function filterPercent(groups, threshold) {
  for (let i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences.filter(s => s.percent >= threshold);
    groups[i].sequences = seqs;
  }
  return groups;
}

function collapse(seqs) {
  var groups = _.groupBy(seqs, s => s.sequence);
  var result = [];
  for (let key in groups) {
    if (!groups.hasOwnProperty(key)) {
      continue;
    }
    var group = groups[key];
    var ids = [];
    var number = 0;
    for (let i=0; i<group.length; i++) {
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
  for (let i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (let j=0; j<seqs.length; j++) {
      seqs[j].html = htmlTable1D(seqs[j].ids, ['Sequence ID']);
    }
  }
  return groups;
}


function addHighlights(groups, regex) {
  for (let i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (let j=0; j<seqs.length; j++) {
      seqs[j].highlights = regexRanges(regex, seqs[j].sequence);
    }
  }
  return groups;
}

function addMask(groups, mrca) {
  for (let i=0; i<groups.length; i++) {
    var seqs = groups[i].sequences;
    for (let j=0; j<seqs.length; j++) {
      var seq = seqs[j];
      seqs[j].mask = seq.sequence.split('').map((aa, idx) => aa === mrca[idx]);
    }
  }
  return groups;
}
