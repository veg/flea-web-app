import Ember from 'ember';

export default Ember.ObjectController.extend({

  regions: ['gp160', 'signal', 'c1', 'v1', 'v2',
            'c2', 'v3', 'c3', 'v4', 'c4', 'v5',
            'c5', 'fusion', 'gp41ecto', 'mper',
            'gp41endo'],
  selectedRegions: ['gp160', 'signal'],
  selectedMetric: 'ds_divergence',
  data: function() {
    var all_data = this.get('model');
    var regions = this.get('selectedRegions');
    var metric = this.get('selectedMetric');
    var result = [];
    // TODO: do this more functionally
    // possible with d3.nest?
    for (var i=0; i<regions.length; i++) {
      var series = {'name': regions[i]};
      var values = [];
      for (var k=0; k<all_data.length; k++) {
        if (regions[i] === all_data[k]["Segment"]) {
          var datum = {'x': all_data[k].Date,
                       'y': all_data[k][metric]};
          values.push(datum);
        }
      }
      values.sort (function (a,b) {return a[0]-b[0];});
      series['values'] = values;
      result.push(series);
    }
    return result;
  }.property('selectedRegions.length', 'selectedMetric')
});
