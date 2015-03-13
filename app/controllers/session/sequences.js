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
  rangeStart: 160,
  rangeStop: 200,
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
      var r = new RegExp(value, 'g');
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
    return this.get('model.frequencies.refToFirstAlnCoords').length;
  }.property('model.frequencies.refToFirstAlnCoords'),

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

  mrcaSlice: function() {
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    // convert 1-indexed [start, stop] to 0-indexed [start, stop)
    return this.get('mrca').sequence.slice(start - 1, stop);
  }.property('alnStart', 'alnStop'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('selectedSequences');
    if (sequences === 'empty') {
      sequences = this.get('observedSequences');
    }
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
  }.property('alnStart', 'alnStop', 'mrcaSlice',
             'selectedSequences.@each',
             'regex'),

  alnStart: function() {
    // 1-indexed aligment range start
    var idx = this.get('rangeStart');
    var map = this.get('model.frequencies.refToFirstAlnCoords');
    return transformIndex(idx, map);
  }.property('model.frequencies.refToFirstAlnCoords', 'rangeStart'),

  alnStop: function() {
    // 1-indexed aligment range stop
    var idx = this.get('rangeStop');
    var map = this.get('model.frequencies.refToLastAlnCoords');
    return transformIndex(idx, map);
  }.property('model.frequencies.refToLastAlnCoords', 'rangeStop'),

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
    for (var motif in counts) {
      if (!(counts.hasOwnProperty(motif))) {
        continue;
      }
      var points = [];
      for (var date in totals) {
        if (!(totals.hasOwnProperty(date))) {
          continue;
        }
        var frac = 0;
        if (counts[motif].hasOwnProperty(date)) {
          frac = counts[motif][date] / totals[date];
        }
        points.push({x: new Date(date), y: frac});
      }
      series.push({name: motif, values: points});
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
      var rest = split_names[1];
      var split_series = _.partition(series, function(elt) {return _.includes(top9, elt.name);});
      var series = split_series[0];
      var rest_series = split_series[1];
      // now combine others
      var combined = rest_series[0].values;
      for (var k=1; k<rest_series.length; k++) {
        var curve = rest_series[k].values;
        for (var m=0; m<curve.length; m++) {
          combined[m].y += curve[m].y;
        }
      }
      series.push({name: 'other', values: combined});
    }
    // TODO: sort by date each motif became prevalent
    return series;
  }.property('selectedPositions.[]', 'selectedSequences.@each'),

  actions: {
    resetRegex: function() {
      this.set('regexValue', this.get('regexDefault'));
    },
    finalizeSelection: function() {
      this.set('selectedSequences', this.get('_selectedSequences'));
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
      seqs[j].sequence = seq.sequence.split('').map(function(aa, idx) {
        return aa === mrca[idx] ? '.' : aa;
      }).join('');
    }
  }
  return groups;
}