import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Controller.extend({

  tree: function() {
    var region = 'gp160';
    var date = 'Combined';
    var distance = 'Nonsynonymous only';
    var tree = this.get('model.trees').filter(function(elt) {
      return ((elt.region === region) &&
              (elt.date === date) &&
              (elt.distance === distance));
    })[0];
    return tree.tree;
  }.property('model.trees.@each'),

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
