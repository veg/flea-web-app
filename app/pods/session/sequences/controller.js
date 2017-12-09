import Ember from 'ember';

import { computed, action, observes } from 'ember-decorators/object';
import { string, conditional } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';

import config from '../../../config/environment';
import ColorLabelMixin from 'flea-web-app/mixins/color-label-mixin';
import {format_date, htmlTable1D, regexRanges, transformIndex, checkRange, checkRanges, mapIfPresent } from 'flea-web-app/utils/utils';
import parser from 'flea-web-app/utils/parser';

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

  showMarkPositive: config.fleaMode,
  markPositive: true,

  defaultMaxMotifs: 10,
  _maxMotifs: 10,
  maxMotifs: 10,

  barChart: false,
  chartType: conditional('barChart', raw('bar'), raw('spline')),

  _oldKeys: [],

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

  @computed('model.sequences.reference', 'model.coordinates.alnToRefCoords')
  alignedReference(ref, map) {
    // replace repeats with '-'
    let rseq = ref.get('sequence');
    let newSeq = [];
    for (let k=0; k<map.length; k++ ) {
      if (map[k] && map[k] === map[k - 1]) {
        newSeq.push('-');
      } else {
        newSeq.push(rseq[k]);
      }
    }
    return newSeq.join('');
  },


  @computed('alignedReference', 'alnRanges')
  refSlice(ref, ranges) {
    if (ref.length === 0) {
      return "";
    }
    return this.toSlices(ref, ranges);
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
    for (const key of Object.keys(grouped)) {
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

  @computed('ranges', 'model.coordinates.refRange')
  clippedRanges(ranges, refRange) {
    let [start, stop] = refRange;
    for (let [a, b] in ranges) {
      if (a < start || a >= stop || b < start || b > stop || a > b) {
	return [[start, R.min(start + 100, stop)]];
      }
    }
    return result;
  },

  @computed('clippedRanges')
  sortedRanges(ranges) {
    ranges.sort((a, b) => a[0] - b[0]);
    return ranges;
  },

  @computed('clippedRanges', 'model.coordinates.refToFirstAlnCoords',
	    'model.coordinates.refToLastAlnCoords',
	    'model.coordinates.refRange')
  alnRanges(ranges, mapFirst, mapLast, refRange) {
    // convert reference ranges to aligment ranges
    checkRanges(ranges, refRange);
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
    for (const m of Object.keys(counts)) {
      let points = [];
      for (const date of Object.keys(totals)) {
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
    let sorted = R.reverse(R.sortBy(
      s => R.sum(R.pluck('y', R.values(s['values']))),
      series
    ))

    if (sorted.length > maxnum) {
      let firstSorted = sorted.slice(0, maxnum);
      let restValues = R.map(s => ({x: s.x, y: 0}), sorted[maxnum].values);
      sorted.slice(maxnum).forEach(s => {
	s.values.forEach(v => {
	  R.find(r => r.x.getTime() === v.x.getTime(), restValues).y += v.y;
	});
      });
      firstSorted.push({
	name: 'Others',
	values: restValues,
      });
      sorted = firstSorted;
    }
    return sorted;
  },

  @computed('cappedTrajectories', '_oldKeys',
	    'colorScaleMotif',
	    'model.dates.sortedVisitCodes',
	    'model.dates.sortedDates',
	    'chartType', 'barChart')
  trajectoryData(data, oldKeys, colorScale, visitCodes, dates, chartType, barChart) {
    let names = R.pluck('name', data)
    this.set('_oldKeys', names);

    let columns = data.map(s => {
      let values = s.values;
      values.sort((a, b) => a.x - b.x);
      let ys = values.map(v => v.y);
      ys.unshift(s.name);
      return ys;
    });

    let colors = R.zipObj(names, R.map(colorScale, names))

    let xticks = barChart ? ['x'].concat(visitCodes) : ['x'].concat(dates);
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

  @computed('barChart', 'model.dates.sortedVisitCodes', 'model.dates.dateToName')
  trajectoryAxis(barChart, dates, datemap) {
    if (barChart) {
      return {
	x: {
          type: 'category',
	  categories: dates,
	}
      };
    }
    return {
      x: {
	type: 'timeseries',
	tick: {
	  format: x => x in datemap ? datemap[x] : moment(x).format('YYYY-MM-DD')
	}
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
  for (const key of Object.keys(groups)) {
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
