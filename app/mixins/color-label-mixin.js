import Ember from 'ember';
import {seqIdToProperty, mapIfPresent} from 'flea-app/utils/utils';

export default Ember.Mixin.create({
  nodeNameTypes: ['visit_code', 'seq_id', 'motif', 'none'],
  nodeNameType: 'visit_code',
  rankColors: false,

  seqIdToNodeName: function() {
    var result = {};
    var nameType = this.get('nodeNameType');
    var seqs = this.get('model.sequences.observedAndMrca');
    if (nameType === 'visit_code') {
      var id_to_date = this.get('model.sequences.seqIdToDate');
      var date_to_visit_code = this.get('model.dates');
      for (let i=0; i<seqs.length; i++) {
        var key = seqs[i].get('id');
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

  colorScale: function() {
    var map = this.get('model.sequences.seqIdToDate');
    delete map["mrca"];
    var dates = _.values(map);
    var s1;
    var maxval;
    if (this.get('rankColors')) {
      var sorted = _.uniqBy(dates, d => d.toString()).sort((a, b) => a - b);
      maxval = sorted.length;
      s1 = d3.scale.ordinal()
        .domain(sorted)
        .range(_.range(sorted.length));
    } else {
      maxval = 1;
      s1 = d3.time.scale()
        .domain(d3.extent(dates))
        .range([0, 1]);
    }
    var colours = ["red", "orange", "yellow", "green", "blue", "indigo"];
    var step = maxval / (colours.length - 1);
    var domain = d3.range(0, maxval + step / 2, step);
    var s2 = d3.scale.linear()
        .domain(domain)
        .range(colours)
        .interpolate(d3.interpolateLab);
    return date => s2(s1(date));
  }.property('model.sequences.seqIdToDate', 'rankColors'),

  motifColorScale: function() {
    var map = this.get('model.sequences.idToMotif');
    var motifs = _.uniq(_.values(map)).sort();
    var scale;
    if (motifs.length > 10) {
      scale = d3.scale.category20();
    } else {
      scale = d3.scale.category10();
    }
    return scale.domain(motifs);
  }.property('model.sequences.idToMotif[]'),

  colorMap: function(map, scale) {
    var result = {};
    for (let key in map) {
      if (map.hasOwnProperty(key)) {
        result[key] = scale(map[key]);
      }
    }
    return result;
  },

  seqIdToNodeColor: function() {
    var map = this.get('model.sequences.seqIdToDate');
    var scale = this.get('colorScale');
    return this.colorMap(map, scale);
  }.property('model.sequences.seqIdToDate', 'colorScale'),

  seqIdToMotifColor: function() {
    if (this.get('nodeNameType') === 'motif') {
      var map = this.get('model.sequences.idToMotif');
      var scale = this.get('motifColorScale');
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
