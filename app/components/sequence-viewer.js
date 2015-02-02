import Ember from 'ember';

export default Ember.Component.extend({

  collapseSeqs: true,
  markPositive: true,
  maskUnchanged: true,
  
  // bound to controller
  inputSequences: null,
  referenceCoords: null,
  rangeStart: 1,
  rangeStop: 1,

  mrcaSlice: function() {
    var start = this.get("rangeStart");
    var stop = this.get("rangeStop");
    return this.get('mrca').sequence.slice(start - 1, stop);
  }.property('rangeStart', 'rangeStop', 'inputSequences@each'),

  groupedSequences: function() {
    var self = this;
    var sequences = self.get('inputSequences');
    var grouped = _.groupBy(sequences, function(s) {
      return s.get('date');
    });
    var result = [];
    var start = this.get("rangeStart");
    var stop = this.get("rangeStop");
    var mrca = this.get('mrcaSlice');
    var mask = this.get('maskUnchanged');
    var process = function(s) {
      var result = s.sequence.slice(start - 1, stop);
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
      result.push({'date': key,
                   'sequences': final_seqs});
    }
    result.sort();
    return result;
  }.property('rangeStart', 'rangeStop', 'mrcaSlice',
             'inputSequences@each', 'maskUnchanged', 'collapseSeqs')
});
