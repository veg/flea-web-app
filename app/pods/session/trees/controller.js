import Ember from 'ember';
import {mapIfPresent, insertNested} from 'flea-app/utils/utils';

export default Ember.Controller.extend({

  _genomicRegion: '',
  _timePoint: '',
  _distanceMeasure: '',

  nodeNameTypes: ['visit_code', 'seq_id', 'motif', 'none'],
  nodeNameType: 'visit_code',

  showCopynumber: true,
  overlapNodes: true,
  rankColors: false,
  radialLayout: false,

  sortState: 'ascending',
  heightScale: 1.0,

  hideCopynumber: Ember.computed.not('showCopynumber'),

  nestedTrees: function() {
    var trees = this.get('model.trees');
    var result = {};
    var datemap = this.get('model.dates');
    for (let i=0; i < trees.length; i++) {
      var tree = trees[i];
      var date = tree.date;
      if (date !== "Combined") {
        date = mapIfPresent(datemap, date);
      }
      insertNested(result, [date, tree.region, tree.distance], tree.tree);
    }
    return result;
  }.property('model.trees.[]'),

  timePoints: function() {
    var trees = this.get('nestedTrees');
    var dates = Object.keys(trees);
    var idx = dates.indexOf("Combined");
    if (idx > 0) {
      // move to front
      dates.splice(0, 0, dates.splice(idx, 1)[0]);
    }
    return dates;
  }.property('nestedTrees'),

  genomicRegions: function() {
    var trees = this.get('nestedTrees');
    var tp = this.get('timePoint');
    return Object.keys(trees[tp]);
  }.property('nestedTrees', 'timePoint'),

  distanceMeasures: function() {
    var trees = this.get('nestedTrees');
    var date = this.get('timePoint');
    var region = this.get('genomicRegion');
    return Object.keys(trees[date][region]);
  }.property('nestedTrees', 'genomicRegion', 'timePoint'),

  handleGet: function(name) {
    var value = this.get('_' + name);
    var options = this.get(name + 's');
    if (!(_.includes(options, value))) {
      return options[0];
    }
    return value;
  },

  handleSet: function(name, value) {
    var options = this.get(name + 's');
    if (!(_.includes(options, value))) {
      this.set('_' + name, options[0]);
      return options[0];
    }
    this.set('_' + name, value);
    return value;
  },

  genomicRegion: Ember.computed('genomicRegions', '_genomicRegion', {
    get: function() {
      return this.handleGet('genomicRegion');
    },
    set: function(key, value) {
      return this.handleSet('genomicRegion', value);
    }
  }),

  timePoint: Ember.computed('timePoints', '_timePoint', {
    get: function() {
      return this.handleGet('timePoint');
    },
    set: function(key, value) {
      return this.handleSet('timePoint', value);
    }
  }),

  distanceMeasure: Ember.computed('distanceMeasures', '_distanceMeasure', {
    get: function() {
      return this.handleGet('distanceMeasure');
    },
    set: function(key, value) {
      return this.handleSet('distanceMeasure', value);
    }
  }),

  tree: function() {
    var date = this.get('timePoint');
    var region = this.get('genomicRegion');
    var distance = this.get('distanceMeasure');
    var tree = this.get('nestedTrees')[date][region][distance];
    return tree;
  }.property('nestedTrees',
             'genomicRegion',
             'timePoints',
             'distanceMeasure'),


  // FIXME: code duplication. Same function used in neutralization controller.
  // Where to put this to share it?
  seqIdToProperty: function(seqs, property) {
    return seqs.reduce(function(acc, s) {
      acc[s.get('id')] = s.get(property);
      return acc;
    }, {});
  },

  seqIdToDate: function() {
    return this.seqIdToProperty(this.get('model.sequences.observedAndMrca'), 'date');
  }.property('model.sequences.observedAndMrca.[]'),

  seqIdToNodeName: function() {
    var result = {};
    var nameType = this.get('nodeNameType');
    var seqs = this.get('model.sequences.observedAndMrca');
    if (nameType === 'visit_code') {
      var id_to_date = this.get('seqIdToDate');
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
      result = this.seqIdToProperty(seqs, 'id');
    } else if (nameType === "motif") {
      result = this.get('model.sequences.idToMotif');
    } else if (nameType === "none") {
      result = _.zipObject(seqs.map(s => [s.get('id'), '']));
    } else {
      throw "unknown node name type: " + nameType;
    }
    return result;
  }.property('model.sequences.observedAndMrca.[]',
             'model.sequences.idToMotif.[]',
             'seqIdToDate', 'nodeNameType'),

  colorScale: function() {
    var map = this.get('seqIdToDate');
    delete map["mrca"];
    var dates = _.values(map);
    var s1;
    var maxval;
    if (this.get('rankColors')) {
      var sorted = _.uniq(dates, d => d.toString()).sort((a, b) => a - b);
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
  }.property('seqIdToDate', 'rankColors'),

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
    var map = this.get('seqIdToDate');
    var scale = this.get('colorScale');
    return this.colorMap(map, scale);
  }.property('seqIdToDate', 'colorScale'),

  seqIdToTextColor: function() {
    if (this.get('nodeNameType') === 'motif') {
      var map = this.get('model.sequences.idToMotif');
      var scale = this.get('motifColorScale');
      return this.colorMap(map, scale);
    }
    return null;
  }.property('seqIdToDate', 'colorScale', 'nodeNameType'),

  actions: {
    setSortState: function(val) {
      this.set('sortState', val);
    },

    selectGenomicRegion: function(value) {
      if (value != null) {
        this.set('genomicRegion', value);
      }
    },
    selectTimePoint: function(value) {
      if (value != null) {
        this.set('timePoint', value);
      }
    },
    selectDistanceMeasure: function(value) {
      if (value != null) {
        this.set('distanceMeasure', value);
      }
    },
    selectNodeNameType: function(value) {
      if (value != null) {
        this.set('nodeNameType', value);
      }
    }

  }
});
