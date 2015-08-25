import Ember from 'ember';
import {format_date} from '../../utils/utils';

export default Ember.Controller.extend({

  _selectedGenomicRegion: '',
  _selectedTimePoint: '',
  _selectedDistanceMeasure: '',

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
    var region = this.get('selectedGenomicRegion');
    var dates = Object.keys(trees[region]);
    var idx = dates.indexOf("Combined");
    if (idx > 0) {
      // move to front
      dates.splice(0, 0, dates.splice(idx, 1)[0]);
    }
    return dates;
  }.property('nestedTrees', 'selectedGenomicRegion'),

  distanceMeasures: function() {
    var trees = this.get('nestedTrees');
    var region = this.get('selectedGenomicRegion');
    var date = this.get('selectedTimePoint');
    return Object.keys(trees[region][date]);
  }.property('nestedTrees', 'selectedGenomicRegion', 'selectedTimePoint'),

  handleSelection: function(options, hidden, key, value) {
    if (value === undefined) {
      if (!(_.includes(options, this.get(hidden)))) {
        this.set(hidden, options[0]);
      }
    } else {
      if (_.includes(options, value)) {
        this.set(hidden, value);
      } else {
        this.set(hidden, options[0]);
      }
    }
    return this.get(hidden);
  },

  selectedGenomicRegion: function(key, value) {
    return this.handleSelection(this.get('genomicRegions'), '_selectedGenomicRegion', key, value);
  }.property('genomicRegions'),

  selectedTimePoint: function(key, value) {
    return this.handleSelection(this.get('timePoints'), '_selectedTimePoint', key, value);
  }.property('timePoints'),

  selectedDistanceMeasure: function(key, value) {
    return this.handleSelection(this.get('distanceMeasures'), '_selectedDistanceMeasure', key, value);
  }.property('distanceMeasures'),

  tree: function() {
    var region = this.get('selectedGenomicRegion');
    var date = this.get('selectedTimePoint');
    var distance = this.get('selectedDistanceMeasure');
    var tree = this.get('nestedTrees')[region][date][distance];
    return tree;
  }.property('nestedTrees',
             'selectedGenomicRegion',
             'selectedTimePoints',
             'selectedDistanceMeasure'),

  // FIXME: code duplication. Same function used in neutralization controller.
  // Where to put this to share it?
  seqIdToDate: function() {
    var seqs = this.get('model.sequences');
    return seqs.reduce(function(acc, s) {
      acc[s['id'].toUpperCase()] = s['date'];
      return acc;
    }, {});
  }.property('model.sequences.[]'),

  actions: {
    setSortState: function(val) {
      this.set('sortState', val);
    },
    setSpaceState: function(val) {
      this.set('spaceState', val);
    },
    selectGenomicRegion: function(value) {
      if (value) {
        this.set('selectedGenomicRegion', value);
      }
    },
    selectTimePoint: function(value) {
      if (value) {
        this.set('selectedTimePoint', value);
      }
    },
    selectDistanceMeasure: function(value) {
      if (value) {
        this.set('selectedDistanceMeasure', value);
      }
    }
  }
});
