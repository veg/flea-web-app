import Ember from 'ember';
import {seqNameToProperty, mapIfPresent} from 'flea-app/utils/utils';
import { computed, action } from 'ember-decorators/object';
import { getBy } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';

export default Ember.Mixin.create({
  nodeNameTypes: ['none', 'visit_code', 'seq_name', 'motif'],
  nodeNameType: 'none',
  rankColors: false,

  seqs: Ember.computed.alias('model.sequences.observedAndMrca'),
  seqNameToDate: Ember.computed.alias('model.sequences.seqNameToDate'),

  nameMapper: {
    'none': 'seqNameToBlank',
    'seq_name': 'seqNameToSelf',
    'visit_code': 'seqNameToVisitCode',
    'motif': 'model.sequences.nameToMotif',
  },

  @computed('nodeNameType', 'nameMapper',
	    'nameToBlank', 'seqNameToSelf',
	    'seqNameToVisitCode',
	    'model.sequences.nameToMotif')
  seqNameToNodeName(key, obj) {
    return this.get(obj[key]);
  },

  @computed('seqs.[]')
  seqNames(seqs) {
    return R.pluck('name', seqs);
  },

  @computed('seqNames')
  realSeqNames(seqNames) {
    return R.filter(id => id.toLowerCase() !== 'mrca', seqNames);
  },

  @computed('seqNames')
  seqNameToBlank(names) {
    return R.zipObj(names, R.repeat("", names.length))
  },

  @computed('seqNames')
  seqNameToSelf(names) {
    return R.zipObj(names, names);
  },

  @computed('realSeqNames', 'seqNameToDate', 'model.dates.dateToName')
  seqNameToVisitCode(names, nameToDate, dateMap) {
    let codes = R.map(name => dateMap[nameToDate[name]], names)
    let result = R.zipObj(names, codes);
    result['mrca'] = 'mrca';
    return result;
  },

  makeColorScale(rankColors, sorted, dates) {
    if (!dates) {
      dates = sorted;
    }
    if (sorted.length !== dates.length) {
      throw 'lengths do not match';
    }

    let labelToDate = R.zipObj(sorted, dates)

    let s1;
    let maxval;
    if (rankColors) {
      maxval = dates.length;
      s1 = d3.scale.ordinal()
        .domain(dates)
        .range(R.range(0, dates.length));
    } else {
      maxval = 1;
      s1 = d3.time.scale()
        .domain(d3.extent(dates))
        .range([0, 1]);
    }
    let colours = ["red", "orange", "yellow", "green", "blue", "indigo"];
    let step = maxval / (colours.length - 1);
    let domain = d3.range(0, maxval + step / 2, step);
    let s2 = d3.scale.linear()
        .domain(domain)
        .range(colours)
        .interpolate(d3.interpolateLab);
    return label => s2(s1(labelToDate[label]));
  },

  @computed('rankColors', 'model.dates.sortedDateObjs')
  colorScale(rankColors, sdos) {
    let d = R.pluck('date', sdos);
    return this.makeColorScale(rankColors, d);
  },

  @computed('rankColors', 'model.dates.sortedVisitCodes',
	    'model.dates.sortedDateObjs')
  colorScaleVisitCode(rankColors, sortedVisitCodes, sdos) {
    let d = R.pluck('date', sdos);
    return this.makeColorScale(rankColors, sortedVisitCodes, d);
  },

  @computed('model.sequences.nameToMotif')
  motifColorScale(nameToMotif) {
    let motifs = R.uniq(R.values(nameToMotif))
    let scale = motifs.length > 10 ? d3.scale.category20() : d3.scale.category10();
    return scale.domain(motifs);
  },

  @computed('model.sequences.seqNameToDate', 'colorScale')
  seqNameToNodeColor(seqNameToDate, scale) {
    return R.map(scale, seqNameToDate);
  },

  @computed('model.sequences.nameToMotif', 'motifColorScale', 'nodeNameType')
  seqNameToMotifColor(seqNameToMotif, scale, nodeNameType) {
    return R.map(scale, seqNameToMotif);
  },

  @action
  selectNodeNameType(value) {
    if (value != null) {
      this.set('nodeNameType', value);
    }
  },
});
