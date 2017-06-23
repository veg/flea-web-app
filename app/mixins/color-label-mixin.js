import Ember from 'ember';
import {seqIdToProperty, mapIfPresent} from 'flea-app/utils/utils';

export default Ember.Mixin.create({
  nodeNameTypes: ['visit_code', 'seq_id', 'motif', 'none'],
  nodeNameType: 'visit_code',
  rankColors: false,

  sortedDates: function() {
    let map = this.get('model.sequences.seqIdToDate');
    delete map["mrca"];
    let dates = _.values(map);
    return _.uniqBy(dates, d => d.toString()).sort((a, b) => a - b);
  }.property('model.sequences.seqIdToDate'),

  sortedVisitCodes: function() {
    let sorted = this.get('sortedDates');
    let dateMap = this.get('model.dates');
    let result = sorted.map(d => dateMap[d]);
    return result;
  }.property('sortedDates', 'model.dates'),

  seqIdToNodeName: function() {
    let result = {};
    let nameType = this.get('nodeNameType');
    let seqs = this.get('model.sequences.observedAndMrca');
    if (nameType === 'visit_code') {
      let id_to_date = this.get('model.sequences.seqIdToDate');
      let date_to_visit_code = this.get('model.dates');
      for (let i=0; i<seqs.length; i++) {
        let key = seqs[i].get('id');
        try {
          result[key] = mapIfPresent(date_to_visit_code, id_to_date[key]);
        } catch (err) {
          result[key] = key;
        }
      }
    } else if (nameType === "seq_id") {
      result = seqIdToProperty(seqs, 'id');
    } else if (nameType === "motif") {
      result = this.get('model.sequences.idToMotif');
    } else if (nameType === "none") {
      result = _.zipObject(seqs.map(s => [s.get('id'), '']));
    } else {
      throw "unknown node name type: " + nameType;
    }
    return result;
  }.property('model.sequences.observedAndMrca.[]',
	     'model.sequences.seqIdToDate.[]',
             'model.sequences.idToMotif.[]',
             'nodeNameType'),

  makeColorScale: function(sorted, dates) {
    if (!dates) {
      dates = sorted;
    }
    if (sorted.length !== dates.length) {
      throw 'lengths do not match';
    }

    let labelToDate = {};
    for (let i=0; i<sorted.length; i++) {
      labelToDate[sorted[i]] = dates[i];
    }

    let s1;
    let maxval;
    if (this.get('rankColors')) {
      maxval = dates.length;
      s1 = d3.scale.ordinal()
        .domain(dates)
        .range(_.range(dates.length));
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

  colorScale: function() {
    return this.makeColorScale(this.get('sortedDates'));
  }.property('sortedDates', 'rankColors'),

  colorScaleVisitCode: function() {
    return this.makeColorScale(this.get('sortedVisitCodes'), this.get('sortedDates'));
  }.property('sortedVisitCodes', 'rankColors'),

  motifColorScale: function() {
    let map = this.get('model.sequences.idToMotif');
    let motifs = _.uniq(_.values(map)).sort();
    let scale;
    if (motifs.length > 10) {
      scale = d3.scale.category20();
    } else {
      scale = d3.scale.category10();
    }
    return scale.domain(motifs);
  }.property('model.sequences.idToMotif[]'),

  colorMap: function(map, scale) {
    let result = {};
    for (let key in map) {
      if (map.hasOwnProperty(key)) {
        result[key] = scale(map[key]);
      }
    }
    return result;
  },

  seqIdToNodeColor: function() {
    let map = this.get('model.sequences.seqIdToDate');
    let scale = this.get('colorScale');
    return this.colorMap(map, scale);
  }.property('model.sequences.seqIdToDate', 'colorScale'),

  seqIdToMotifColor: function() {
    if (this.get('nodeNameType') === 'motif') {
      let map = this.get('model.sequences.idToMotif');
      let scale = this.get('motifColorScale');
      return this.colorMap(map, scale);
    }
    return null;
  }.property('model.sequences.seqIdToDate', 'colorScale', 'nodeNameType'),

  actions: {
    selectNodeNameType: function(value) {
      if (value != null) {
        this.set('nodeNameType', value);
      }
    },
  },
});
