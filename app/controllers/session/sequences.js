import Ember from 'ember';
import {format_date, htmlTable1D, regexRanges, transformIndex, checkRange, checkRanges} from '../../utils/utils';


var pngsRegex = 'N\\-*[^P^-^|]\\-*[ST]\\-*[^P^-^|]';


export default Ember.ObjectController.extend({

  // set by selector component
  _selectedSequences: [],

  // set from _selectedSequences in finalizeSelection action
  selectedSequences: 'empty',

  // TODO: maybe these should be in a View instead
  // range in 0-indexed [start, stop) reference coordinates
  _ranges: [[159, 200]],

  _regexValue: pngsRegex,  // displayed in template
  regexValue: pngsRegex,  // triggers actual update
  regexDefault: pngsRegex,
  _regex: '',

  _threshold: 1,
  threshold: 1,

  markPositive: true,

  // in alignment 0-indexed coordinates
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
  }.property('model.sequences.@each'),

  mrca: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'MRCA')[0];
  }.property('model.sequences.@each'),

  reference: function() {
    var seqs = this.get('model.sequences');
    return this.filterSequenceTypes(seqs, 'Reference')[0];
  }.property('model.sequences.@each'),

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
      return {sequence: result,
              copyNumber: copynumbers[s.id],
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
             'selectedSequences.@each',
             'regex', 'threshold'),

  ranges: function(key, val, previousValue) {
    if (arguments.length > 1) {
      this.set('_ranges', val);
    }
    var ranges = this.get('_ranges');
    ranges.sort((a, b) => a[0] - b[0]);
    return ranges;
  }.property('ranges'),

  alnRanges: function() {
    // convert reference ranges to aligment ranges
    var ranges = this.get('ranges');
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
    var positions = this.get('selectedPositions').toArray().sort((a, b) => a - b);
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
  }.property('selectedPositions.[]', 'selectedSequences.@each'),

  validPredefinedRegions: function() {
    var [start, stop] = this.get('model.frequencies.refRange');
    var regions = this.get('model.predefinedRegions');
    return regions.filter(r => r.start >= start && r.stop <= stop);
  }.property('model.predefinedRegions', 'model.frequencies.refRange'),

  actions: {
    doRegex: function() {
      this.set('regexValue', this.get('_regexValue'));
    },

    doThreshold: function() {
      var t = this.get('_threshold').trim();
      if (t === "") {
        t = 0;
      }
      t = +t;
      if (t >= 0 && t <= 100) {
        this.set('_threshold', t);
        this.set('threshold', t);
      }
    },

    resetRegex: function() {
      this.set('_regexValue', this.get('regexDefault'));
      this.set('regexValue', this.get('regexDefault'));
    },

    finalizeSelection: function() {
      this.set('selectedSequences', this.get('_selectedSequences'));
    },

    updateAlnRange: function(idx, range) {
      checkRange(range, this.get('validAlnRange'));
      var alnRanges = this.get('alnRanges');
      var map = this.get('model.frequencies.alnToRefCoords');
      var refRanges = this.get('ranges');

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
      var ranges = this.get('ranges').slice(0);
      ranges.push(range);
      this.set('ranges', ranges);
    },

    rmRange: function(idx) {
      var ranges = this.get('ranges');
      this.set('ranges', ranges.filter((elt, i) => i !== idx));
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
      // FIXME: remove ranges crossing split barriers
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
