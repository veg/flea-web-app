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
    var slice = function(s) {
      return s.sequence.slice(start - 1, stop);
    };
    for (var key in grouped) {
      if (!grouped.hasOwnProperty(key)) {
        continue;
      }
      result.push({'date': key,
                   'sequences': grouped[key].map(slice)});
    }
    result.sort();
    return result;
  }.property('rangeStart', 'rangeStop', 'inputSequences@each')
});
