import Ember from 'ember';
import {seqIdToProperty, mapIfPresent} from 'flea-app/utils/utils';
import { computed, action } from 'ember-decorators/object';
import { getBy } from 'ember-awesome-macros';
import raw from 'ember-macro-helpers/raw';

export default Ember.Mixin.create({
  nodeNameTypes: ['none', 'visit_code', 'seq_id', 'motif'],
  nodeNameType: 'none',
  rankColors: false,

  seqs: Ember.computed.alias('model.sequences.observedAndMrca'),
  seqIdToDate: Ember.computed.alias('model.sequences.seqIdToDate'),

  nameMapper: {
    'none': 'seqIdToBlank',
    'seq_id': 'seqIdToSelf',
    'visit_code': 'seqIdToVisitCode',
    'motif': 'model.sequences.idToMotif',
  },

  @computed('nodeNameType', 'nameMapper',
	    'idToBlank', 'seqIdToSelf',
	    'seqIdToVisitCode',
	    'model.sequences.idToMotif')
  seqIdToNodeName(key, obj) {
    return this.get(obj[key]);
  },

  @computed('seqs.[]')
  seqIds(seqs) {
    return R.map(R.prop('id'), seqs);
  },

  @computed('seqIds')
  realSeqIds(seqIds) {
    return R.filter(id => id.toLowerCase() !== 'mrca', seqIds);
  },

  @computed('seqIds')
  seqIdToBlank(ids) {
    return R.zipObj(ids, R.repeat("", ids.length))
  },

  @computed('seqIds')
  seqIdToSelf(ids) {
    return R.zipObj(ids, ids);
  },

  @computed('seqIdToDate')
  sortedDates(obj) {
    delete obj["mrca"];
    let dates = R.uniqBy(R.toString, R.values(obj));
    return R.sort((a, b) => a - b, dates);
  },

  @computed('sortedDates', 'model.dates')
  sortedVisitCodes(dates, dateMap) {
    return dates.map(d => dateMap[d]);
  },

  @computed('realSeqIds', 'seqIdToDate', 'model.dates')
  seqIdToVisitCode(ids, idToDate, dateMap) {
    let codes = R.map(id => dateMap[idToDate[id]], ids)
    let result = R.zipObj(ids, codes);
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

  @computed('rankColors', 'sortedDates', 'rankColors')
  colorScale(rankColors, sortedDates) {
    return this.makeColorScale(rankColors, sortedDates);
  },

  @computed('rankColors', 'sortedVisitCodes', 'sortedDates')
  colorScaleVisitCode(rankColors, sortedVisitCodes, sortedDates) {
    return this.makeColorScale(rankColors, sortedVisitCodes, sortedDates);
  },

  @computed('model.sequences.idToMotif[]')
  motifColorScale(idToMotif) {
    let motifs = R.uniq(R.values(idToMotif))
    let scale = motifs.length > 10 ? d3.scale.category20() : d3.scale.category10();
    return scale.domain(motifs);
  },

  @computed('model.sequences.seqIdToDate', 'colorScale')
  seqIdToNodeColor(seqIdToDate, scale) {
    return R.map(scale, seqIdToDate);
  },

  @computed('model.sequences.seqIdToDate', 'motifColorScale', 'nodeNameType')
  seqIdToMotifColor(seqIdToDate, scale, nodeNameType) {
    return R.map(scale, seqIdToDate);
  },

  @action
  selectNodeNameType(value) {
    if (value != null) {
      this.set('nodeNameType', value);
    }
  },
});
