import Ember from 'ember';
import {format_date, htmlTable1D, regexRanges, transformIndex, checkRange, checkRanges, mapIfPresent } from 'flea-app/utils/utils';
import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';
import parser from 'flea-app/utils/parser';
import { computed, action } from 'ember-decorators/object';
import { string, conditional } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';


let pngsPattern = 'N[^P][ST]';

export default Ember.Controller.extend(ColorLabelMixin, {

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

  defaultMaxMotifs: 10,
  _maxMotifs: 10,
  maxMotifs: 10,

  barChart: false,
  chartType: conditional('barChart', raw('bar'), raw('spline')),

  _oldKeys: [],

  @computed('model.sequences.reference', 'model.coordinates.alnToRefCoords')
  reference(ref, map) {
    // replace repeats with '-'
    let newSeq = [ref.sequence[0]];
    for (let k=1; k<map.length; k++ ) {
      if (map[k] === map[k - 1]) {
        newSeq.push('-');
      } else {
        newSeq.push(ref.sequence[k]);
      }
    }
    ref.sequence = newSeq.join('');
    return ref;
  },

  // parses simple grammar and builds RegExp that takes gaps and pipes
  // into account
  @computed('pattern')
  regex(value) {
    this.set('patternClass', 'input-valid');
    if (value.length === 0) {
      return ".^";
    }
    try {
      let result = [];
      let parsed = parser.parse(value);
      for (let i=0; i<parsed.length; i++) {
        let part = parsed[i];
        if (part.type === "amino") {
          result.push(part.value + part.postmod);
        } else {
          let partvalue = part.value;
          if (part.premod === "^") {
            partvalue += '\\|\\-';
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
  },

  @computed('model.coordinates.alnToRefCoords.length')
  validAlnRange(n) {
    return [0, n];
  },

  toSlices(seq, ranges) {
    return ranges.map(range => seq.slice(range[0], range[1])).join('|');
  },

  @computed('model.sequences.mrca', 'alnRanges')
  mrcaSlice(mrca, ranges) {
    return this.toSlices(mrca.sequence, ranges);
  },

  @computed('model.sequences.reference', 'alnRanges')
  refSlice(ref, ranges) {
    if (ref.length === 0) {
      return "";
    }
    return this.toSlices(ref.sequence, ranges);
  },

  mrcaSplit: string.split('mrcaSlice', raw('')),
  refSplit: string.split('refSlice', raw('')),

  @computed('model.sequences.observed.[]',
	    'model.dates.dateToName', 'alnRanges',
	    'mrcaSlice', 'regex', 'threshold')
  groupedSequences(sequences, datemap,
		   alnRanges, mrcaSlice, regex, threshold) {
    let self = this;
    let result = [];
    let grouped = R.groupBy(s => s.get('date'), sequences);
    let slice = function(s) {
      let result = self.toSlices(s.sequence, alnRanges);
      let cn = 0;
      return {sequence: result,
              copyNumber: s.copynumber,
              names: [s.name]};
    };
    for (let key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      let final_seqs = grouped[key].map(slice);
      final_seqs = collapse(final_seqs);
      final_seqs.sort((a, b) => b.copyNumber - a.copyNumber);
      let d = new Date(key);

      result.push({'date': d,
                   'label': mapIfPresent(datemap, d),
                   'sequences': final_seqs});
    }
    result.sort((a, b) => a.date - b.date);
    result.forEach(function(elt) {
      elt.date = format_date(elt.date);
    });

    // TODO: working here. make each one independent.

    // TODO: do not redo everything on update. make DOM updates as
    // small as possible.
    result = addPercent(result);
    result = filterPercent(result, threshold);
    result = addHTML(result);
    result = htmlRows(result, regex, mrcaSlice);
    return result;
  },

  @computed('ranges')
  sortedRanges(ranges) {
    ranges.sort((a, b) => a[0] - b[0]);
    return ranges;
  },

  @computed('ranges', 'model.coordinates.refToFirstAlnCoords',
	    'model.coordinates.refToLastAlnCoords')
  alnRanges(ranges, mapFirst, mapLast) {
    // convert reference ranges to aligment ranges
    checkRanges(ranges, this.get('model.coordinates.refRange'));
    let result = ranges.map(function(range) {
      let start = transformIndex(range[0], mapFirst, false);
      let stop = transformIndex(range[1], mapLast, true);
      return [start, stop];
    });
    checkRanges(result, this.get('validAlnRange'));
    return result;
  },

  @computed('model.sequences.observed.[]',
	    'model.sequences.nameToMotif.[]')
  aaTrajectories(sequences, motifs) {
    let counts = {};
    let totals = {};
    for (let i=0; i<sequences.length; i++ ) {
      let seq = sequences[i];
      let motif = motifs[seq.get('name')];
      let date = seq.get('date');
      let copynumber = seq.get('copynumber');
      if (!(counts.hasOwnProperty(motif))) {
        counts[motif] = {};
      }
      if (!(counts[motif].hasOwnProperty(date))) {
        counts[motif][date] = 0;
      }
      counts[motif][date] += copynumber;
      if (!(totals.hasOwnProperty(date))) {
        totals[date] = 0;
      }
      totals[date] += copynumber;
    }
    let series = [];
    for (let m in counts) {
      if (!(counts.hasOwnProperty(m))) {
        continue;
      }
      let points = [];
      for (let date in totals) {
        if (!(totals.hasOwnProperty(date))) {
          continue;
        }
        let frac = 0;
        if (counts[m].hasOwnProperty(date)) {
          frac = counts[m][date] / totals[date];
        }
        points.push({x: new Date(date), y: frac});
      }
      series.push({name: m, values: points});
    }
    return series;
  },

  @computed('aaTrajectories', 'maxMotifs')
  cappedTrajectories(series, maxnum) {
    for (let j=0; j<series.length; j++) {
      let trajectory = series[j];
      let tmax = R.max(R.pluck('y', R.values(trajectory)));
      series[j].tmax = tmax;
    }
    series.sort((a, b) => b.tmax - a.tmax);

    // take top n-1 and combine others
    if (series.length > maxnum) {
      let first_series = series.slice(0, maxnum);
      let rest_series = series.slice(maxnum);
      let combined = rest_series[0].values;
      for (let k=1; k<rest_series.length; k++) {
        let curve = rest_series[k].values;
        for (let n=0; n<curve.length; n++) {
          combined[n].y += curve[n].y;
        }
      }
      first_series.push({name: 'Other', values: combined});
      series = first_series;
    }
    // TODO: sort by date each motif became prevalent
    return series;
  },

  @computed('cappedTrajectories', '_oldKeys',
	    'motifColorScale', 'model.dates.sortedVisitCodes',
	    'chartType')
  trajectoryData(data, oldKeys, colorScale, visitCodes, chartType) {
    let names = R.pluck('name', data)
    this.set('_oldKeys', names);

    let columns = data.map(s => {
      let values = s.values;
      values.sort((a, b) => a.x - b.x);
      let ys = values.map(v => v.y);
      ys.unshift(s.name);
      return ys;
    });

    let colors = R.zipObj(name, R.map(colorScale, name))

    let xticks = ['x'].concat(visitCodes);
    columns.push(xticks);
    let result = {
      x: 'x',
      columns: columns,
      unload: oldKeys,
      type: chartType,
      colors: colors,
    };
    if (chartType === 'bar') {
      result['groups'] = [names];
    }
    return result;
  },

  @computed('model.dates.sortedVisitCodes')
  trajectoryAxis(dates) {
    return {
      x: {
        type: 'category',
	categories: dates,
      }
    };
  },

  transition: {
    duration: 0
  },

  tooltip: {
    format: {
      value: d3.format('.4f')
    }
  },

  @computed('model.predefinedRegions', 'model.coordinates.refRange')
  validPredefinedRegions(regions, refrange) {
    let [start, stop] = refrange;
    return regions.filter(r => r.start >= start && r.stop <= stop);
  },

  @action
  doPattern() {
    this.set('pattern', this.get('_pattern'));
  },

  @action
  doThreshold() {
    let t = this.get('_threshold');
    if (t === "") {
      t = 0;
    }
    t = +t;
    if (t >= 0 && t <= 100) {
      this.set('_threshold', t);
      this.set('threshold', t);
    }
  },

  @action
  doMaxMotifs() {
    let t = this.get('_maxMotifs');
    if (t === "") {
      t = this.get('defaultMaxMotifs');
    }
    t = +t;
    if (t >= 1 && t <= 100) {
      this.set('_maxMotifs', t);
      this.set('maxMotifs', t);
    }
  },

  @action
  resetPattern() {
    this.set('_pattern', this.get('patternDefault'));
    this.set('pattern', this.get('patternDefault'));
  },

  @action
  updateAlnRange(idx, range) {
    checkRange(range, this.get('validAlnRange'));
    let map = this.get('model.coordinates.alnToRefCoords');
    let refRanges = this.get('sortedRanges');

    // shallow copy, so we have a different object. Ensures that
    // calling this.set() triggers computed properties.
    let result = refRanges.slice(0);
    result[idx] = [transformIndex(range[0], map, false),
                   transformIndex(range[1], map, true)];
    result.sort((a, b) => a[0] - b[0]);
    this.set('ranges', result);
  },

  @action
  setRanges(ranges) {
    checkRanges(ranges, this.get('model.coordinates.refRange'));
    this.set('ranges', ranges);
  },

  @action
  addRange(range) {
    checkRange(range, this.get('model.coordinates.refRange'));
    let ranges = this.get('sortedRanges').slice(0);
    ranges.push(range);
    this.set('ranges', ranges);
  },

  @action
  rmRange(idx) {
    let ranges = this.get('sortedRanges');
    this.set('ranges', ranges.filter((elt, i) => i !== idx));
  },

  @action
  setSelectedPositions(positions) {
    let stop = this.get('validAlnRange')[1];
    if (positions && R.all(R.map(p => (p >= 0 && p < stop)), positions)) {
      this.set('model.sequences.selectedPositions', positions);
    }
  }
});


function addPercent(groups) {
  for (let i=0; i<groups.length; i++) {
    let seqs = groups[i].sequences;
    let total = 0;
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
    let seqs = groups[i].sequences.filter(s => s.percent >= threshold);
    groups[i].sequences = seqs;
  }
  return groups;
}

function collapse(seqs) {
  let groups = R.groupBy(s => s.sequence, seqs);
  let result = [];
  for (let key in groups) {
    if (!groups.hasOwnProperty(key)) {
      continue;
    }
    let group = groups[key];
    let names = [];
    let number = 0;
    for (let i=0; i<group.length; i++) {
      names.push(group[i].names[0]);
      number += group[i].copyNumber;
    }
    result.push({
      sequence: group[0].sequence,
      names: names,
      copyNumber: number
    });
  }
  return result;
}

// TODO: do this with a helper or a component instead
function addHTML(groups) {
  for (let i=0; i<groups.length; i++) {
    let seqs = groups[i].sequences;
    for (let j=0; j<seqs.length; j++) {
      seqs[j].html = htmlTable1D(seqs[j].names, ['Sequence ID']);
    }
  }
  return groups;
}


function htmlRows(groups, regex, mrca) {
  for (let i=0; i<groups.length; i++) {
    let seqs = groups[i].sequences;
    for (let j=0; j<seqs.length; j++) {
      let seq = seqs[j];
      let highlightRanges = regexRanges(regex, seq.sequence);
      let highlightPositions = new Set();
      for (let k=0; k<highlightRanges.length; k++) {
        let range = highlightRanges[k];
        for (let n=range[0]; n<=range[1]; n++) {
          highlightPositions.add(n);
        }
      }
      let htmlElts = seq.sequence.split('').map((aa, idx) => {
	let highlight = highlightPositions.has(idx);
        return aaHTML(aa, mrca[idx], highlight);
      });
      seq.htmlRow = htmlElts.join('');
    }
  }
  return groups;
}

// TODO: this should not be in the controller
function aaHTML(aa, other, highlight) {
  aa = aa.toUpperCase();
  let mask = aa === other
  let aaClass = aa === "|" ? "seperator" : (aa === "-" ? "aa aaGap" : `aa aa${aa}`);
  if (highlight) {
    aaClass = `${aaClass} pngs`
  }
  aa = (mask && aa !== "-") ? "." : aa;
  return Ember.String.htmlSafe(`<td class="${aaClass}">${aa}</td>`);
}
