import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Controller.extend({

  _selectedGenomicRegion: '',
  _selectedTimePoint: '',
  _selectedDistanceMeasure: '',

  linkeToSelection: true,
  showCloneNames: true,

  nestedTrees: function() {
    var trees = this.get('model.trees');
    var keys = {};
    for (var i=0; i < trees.length; i++) {
      var tree = trees[i];
      if (!(tree.region in keys)) {
        keys[tree.region] = {};
      }
      if (!(tree.date in keys[tree.region])) {
        keys[tree.region][tree.date] = {};
      }
      if (!(tree.distance in keys[tree.region][tree.date])) {
        keys[tree.region][tree.date][tree.distance] = tree.tree;
      }
    }
    return keys;
  }.property('model.trees.@each'),

  genomicRegions: function() {
    var trees = this.get('nestedTrees');
    return Object.keys(trees);
  }.property('nestedTrees'),

  handleSelection: function(options, hidden, key, value, oldvalue) {
    var optionvalues = this.get(options);
    if (value === undefined) {
      if (!(_.includes(optionvalues, this.get(hidden)))) {
        this.set(hidden, optionvalues[0]);
      }
    } else {
      if (_.includes(optionvalues, value)) {
        this.set(hidden, value);
      } else {
        this.set(hidden, optionvalues[0]);
      }
    }
    return this.get(hidden);
  },

  selectedGenomicRegion: function(key, value, oldvalue) {
    return this.handleSelection('genomicRegions', '_selectedGenomicRegion', key, value, oldvalue);
  }.property('genomicRegions'),

  selectedTimePoint: function(key, value, oldvalue) {
    return this.handleSelection('timePoints', '_selectedTimePoint', key, value, oldvalue);
  }.property('timePoints'),

  selectedDistanceMeasure: function(key, value, oldvalue) {
    return this.handleSelection('distanceMeasures', '_selectedDistanceMeasure', key, value, oldvalue);
  }.property('distanceMeasures'),

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
    var seqs = this.get('model')['sequences'];
    return seqs.reduce(function(acc, s) {
      acc[s['id']] = s['date'];
      return acc;
    }, {});
  }.property('model.sequences.@each')

});
