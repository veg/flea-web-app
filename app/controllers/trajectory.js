import Ember from 'ember';

export default Ember.ObjectController.extend({

  // TODO: populate these on the fly
  regions: ['gp160', 'signal', 'c1', 'v1', 'v2',
            'c2', 'v3', 'c3', 'v4', 'c4', 'v5',
            'c5', 'fusion', 'gp41ecto', 'mper',
            'gp41endo'],
  selectedRegions: ['gp160'],

  evoMetrics: ['ds_divergence',
               'dn_divergence',
               'total_divergence',
               'ds_diversity',
               'dn_diversity',
               'total_diversity'],
  selectedEvoMetrics: ['ds_divergence'],

  phenoMetrics: ['Length',
                 'PNGS',
                 "IsoelectricPoint",],
  selectedPhenoMetrics: ['Length', 'PNGS'],


  evoData: function() {
    var all_data = this.get('model');
    var regions = this.get('selectedRegions');
    var metrics = this.get('selectedEvoMetrics');
    return prepData(all_data, regions, metrics);
  }.property('model', 'selectedRegions.@each',
             'selectedEvoMetrics.@each'),

  phenoData: function() {
    var all_data = this.get('model');
    var regions = this.get('selectedRegions');
    var metrics = this.get('selectedPhenoMetrics');
    return prepData(all_data, regions, metrics);
  }.property('model',
             'selectedRegions.@each',
             'selectedPhenoMetrics.@each')

});


function prepData(all_data, regions, metrics) {
  if (metrics.length === 1) {
    return singleMetric(all_data, regions, metrics[0]);
  } else if (regions.length === 1) {
    return singleRegion(all_data, regions[0], metrics);
  } else {
    throw "Must use either single region or single metric";
  }
}


function singleMetric(all_data, regions, metric) {
  var result = [];
  // TODO: do this more functionally
  // possible with d3.nest?
  for (var i=0; i<regions.length; i++) {
    var region = regions[i];
    var series = {'name': region};
    var values = [];
    for (var k=0; k<all_data.length; k++) {
      if (region === all_data[k]["Segment"]) {
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
}


// TODO: code duplication
function singleRegion(all_data, region, metrics) {
  var result = [];
  for (var i=0; i<metrics.length; i++) {
    var metric = metrics[i];
    var series = {'name': metric};
    var values = [];
    for (var k=0; k<all_data.length; k++) {
      if (region === all_data[k]["Segment"]) {
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
}
