import Ember from 'ember';

export default Ember.Controller.extend({

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
  selectedEvoMetrics: ['ds_divergence',
                       'dn_divergence',
                       'total_divergence',
                       'total_diversity'],

  phenoMetrics: ['Length',
                 'PNGS',
                 "IsoelectricPoint",],
  selectedPhenoMetrics: ['Length', 'PNGS'],

  maxRegions: function () {
    var m = ((this.get('selectedEvoMetrics.length') > 1) ||
             this.get('selectedPhenoMetrics.length') > 1);
    if (m) {
      return 1;
    }
    return 10;
  }.property('selectedEvoMetrics.length',
             'selectedPhenoMetrics.length'),

  // TODO: multiselect component, not controller, should handle this
  // and the if/else xselect selection in the template.
  multipleRegions: function() {
    return this.get('maxRegions') > 1;
  }.property('maxRegions'),

  maxEvoMetrics: function () {
    var r = (this.get('selectedRegions.length') > 1);
    if (r) {
      return 1;
    }
    return 4;
  }.property('selectedRegions.length'),

  multipleEvoMetrics: function() {
    return this.get('maxEvoMetrics') > 1;
  }.property('maxEvoMetrics'),

  maxPhenoMetrics: function () {
    var r = (this.get('selectedRegions.length') > 1);
    if (r) {
      return 1;
    }
    return 2;
  }.property('selectedRegions.length'),

  multiplePhenoMetrics: function() {
    return this.get('maxPhenoMetrics') > 1;
  }.property('maxPhenoMetrics'),

  evoData: function() {
    var all_data = this.get('model');
    var regions = this.get('selectedRegions');
    var metrics = this.get('selectedEvoMetrics');
    return prepData(all_data, regions, metrics);
  }.property('model', 'selectedRegions.[]',
             'selectedEvoMetrics.[]'),

  _phenoData: function(index) {
    var all_data = this.get('model');
    var regions = this.get('selectedRegions');
    var metrics = this.get('selectedPhenoMetrics');
    if (regions.length > 1) {
      return prepData(all_data, regions, metrics);
    } else if (metrics.length > 1) {
      return singleRegion(all_data, regions[0], [metrics[index]]);
    } else{
      return singleRegion(all_data, regions[0], metrics);
    }
  },

  phenoData: function() {
    var result = this._phenoData(0);
    return result;
  }.property('model',
             'selectedRegions.[]',
             'selectedPhenoMetrics.[]'),

  phenoData2: function() {
    var result = [];
    if (this.get('selectedPhenoMetrics.length') > 1) {
      result = this._phenoData(1);
    }
    return result;
  }.property('model',
             'selectedRegions.[]',
             'selectedPhenoMetrics.[]'),

  handleSelection: function(key, values) {
    if (values) {
      if (typeof values === 'string' || values instanceof String) {
        values = [values];
      }
      this.set(key, values);
    }
  },

  actions: {
    selectRegions: function(values) {
      this.handleSelection('selectedRegions', values);
    },

    selectEvoMetrics: function(values) {
      this.handleSelection('selectedEvoMetrics', values);
    },

    selectPhenoMetrics: function(values) {
      this.handleSelection('selectedPhenoMetrics', values);
    }
  }
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
  for (let i=0; i<regions.length; i++) {
    var region = regions[i];
    var series = {'name': region};
    var values = [];
    for (let k=0; k<all_data.length; k++) {
      if (region === all_data[k]["Segment"]) {
        var datum = {'x': all_data[k].Date,
                     'y': all_data[k][metric]};
        values.push(datum);
      }
    }
    values.sort((a,b) => a.x - b.x);
    series['values'] = values;
    result.push(series);
  }
  return result;
}


// TODO: code duplication
function singleRegion(all_data, region, metrics) {
  var result = [];
  for (let i=0; i<metrics.length; i++) {
    var metric = metrics[i];
    var series = {'name': metric};
    var values = [];
    for (let k=0; k<all_data.length; k++) {
      if (region === all_data[k]["Segment"]) {
        var datum = {'x': all_data[k].Date,
                     'y': all_data[k][metric]};
        values.push(datum);
      }
    }
    values.sort((a,b) => a.x - b.x);
    series['values'] = values;
    result.push(series);
  }
  return result;
}
