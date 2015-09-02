import Ember from 'ember';
import {format_date} from 'flea-app/utils/utils';

export default Ember.Controller.extend({

  _genomicRegion: '',
  _timePoint: '',
  _distanceMeasure: '',

  nodeNameTypes: ['id', 'date', 'motif'],
  nodeNameType: 'id',

  linkeToSelection: true,
  showDates: true,

  sortState: 'ascending',
  spaceState: 0,

  nestedTrees: function() {
    var trees = this.get('model.trees');
    var keys = {};
    for (let i=0; i < trees.length; i++) {
      var tree = trees[i];
      if (!(tree.region in keys)) {
        keys[tree.region] = {};
      }
      var date = tree.date;
      if (date !== "Combined") {
        date = format_date(tree.date);
      }
      if (!(date in keys[tree.region])) {
        keys[tree.region][date] = {};
      }
      if (!(tree.distance in keys[tree.region][date])) {
        keys[tree.region][date][tree.distance] = tree.tree;
      }
    }
    return keys;
  }.property('model.trees.[]'),

  genomicRegions: function() {
    var trees = this.get('nestedTrees');
    return Object.keys(trees);
  }.property('nestedTrees'),

  timePoints: function() {
    var trees = this.get('nestedTrees');
    var region = this.get('genomicRegion');
    var dates = Object.keys(trees[region]);
    var idx = dates.indexOf("Combined");
    if (idx > 0) {
      // move to front
      dates.splice(0, 0, dates.splice(idx, 1)[0]);
    }
    return dates;
  }.property('nestedTrees', 'genomicRegion'),

  distanceMeasures: function() {
    var trees = this.get('nestedTrees');
    var region = this.get('genomicRegion');
    var date = this.get('timePoint');
    return Object.keys(trees[region][date]);
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
    var region = this.get('genomicRegion');
    var date = this.get('timePoint');
    var distance = this.get('distanceMeasure');
    var tree = this.get('nestedTrees')[region][date][distance];
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
    return this.seqIdToProperty(this.get('model.sequences'), 'date');
  }.property('model.sequences.[]'),

  seqIdToNodeName: function() {
    var result = {};
    var nameType = this.get('nodeNameType');
    var seqs = this.get('model.sequences');
    if (nameType === 'date') {
      var map = this.get('seqIdToDate');
      for (let key in map) {
        if (map.hasOwnProperty(key)) {
          try {
            result[key] = format_date(map[key]);
          } catch (err) {
            result[key] = key;
          }
        }
      }
    } else if (nameType === "id") {
      result = this.seqIdToProperty(seqs, 'id');
    } else if (nameType === "motif") {
      result =this.seqIdToProperty(seqs, 'motif');
    } else {
      throw "unknown node name type: " + nameType;
    }
    return result;
  }.property('model.sequences',
             'model.sequences.@each.id',
             'model.sequences.@each.motif',
             'seqIdToDate', 'nodeNameType'),

  seqIdToNodeColor: function() {
    var map = this.get('seqIdToDate');
    var colors = d3.scale.category10();
    colors.domain(_.values(map));
    var result = {};
    for (let key in map) {
      if (map.hasOwnProperty(key)) {
        result[key] = colors(map[key]);
      }
    }
    return result;
  }.property('seqIdToDate'),

  actions: {
    setSortState: function(val) {
      this.set('sortState', val);
    },
    setSpaceState: function(val) {
      this.set('spaceState', val);
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
