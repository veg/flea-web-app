import Ember from 'ember';
import {format_date} from '../utils/utils';

export default Ember.Component.extend({

  // bound to controller
  inputSequences: [],
  referenceCoords: null,
  rangeStart: 1,
  rangeStop: 1,

  transformCoord: function(coord) {
    var ref = this.get('refCoords');
    return ref.indexOf(coord);
  },

  alnStart: function() {
    return this.transformCoord(this.get('rangeStart'));
  }.property('refCoords', 'rangeStart'),

  alnStop: function() {
    return this.transformCoord(this.get('rangeStop'));
  }.property('refCoords', 'rangeStop'),

  mrcaSlice: function() {
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    return this.get('mrca').sequence.slice(start, stop + 1);
  }.property('alnStart', 'alnStop', 'inputSequence.@each'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('inputSequences');
    var grouped = _.groupBy(sequences, function(s) {
      return s.get('date');
    });
    var result = [];
    var start = this.get("alnStart");
    var stop = this.get("alnStop");
    var mrca = this.get('mrcaSlice');
    var mask = this.get('maskUnchanged');
    var process = function(s) {
      var result = s.sequence.slice(start, stop + 1);
      if (mask) {
        result = result.split('').map(function(aa, idx) {
          return aa === mrca[idx] ? '.' : aa;
        }).join('');
      }
      return result;
    };
    for (var key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      var final_seqs = grouped[key].map(process);
      if (this.get('collapseSeqs')) {
        final_seqs = _.unique(final_seqs);
      }
      result.push({'date': format_date(new Date(key)),
                   'sequences': final_seqs});
    }
    result.sort();
    return result;
  }.property('alnStart', 'alnStop', 'mrcaSlice',
             'inputSequence.@each', 'inputSequences.length', 'maskUnchanged', 'collapseSeqs')
});
