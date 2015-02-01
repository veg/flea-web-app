import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.ObjectController.extend({
  regions: ['gp160', 'signal'],
  selectedRegion: 'signal',
  selectedMetric: 'ds_divergence',
  data: function() {
    var all_data = this.get('model');
    var region = this.get('selectedRegion');
    var metric = this.get('selectedMetric');
    var result = [];
    // TODO: do this more functionally
    for (var k=0; k<all_data.length; k++) {
      if (region === all_data[k]["Segment"]) {
        var datum = [all_data[k].Date, all_data[k][metric]];
        result.push (datum);
      }
    }
    result.sort (function (a,b) {return a[0]-b[0];});
    return result;
  }.property('selectedRegion', 'selectedMetric')
});
