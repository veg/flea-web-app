import Ember from 'ember';

export default Ember.Component.extend({
  
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
    var process = function(s) {
      var result = s.sequence.slice(start - 1, stop);
      var strarray = result.split('');
      return strarray.map(function(aa, idx) {
        return aa === mrca[idx] ? '.' : aa;
      }).join('');
    };
    for (var key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      result.push({'date': key,
                   'sequences': grouped[key].map(process)});
    }
    result.sort();
    return result;
    }.property('rangeStart', 'rangeStop', 'mrcaSlice', 'inputSequences@each')
});
