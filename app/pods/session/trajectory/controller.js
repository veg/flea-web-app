import Ember from 'ember';

export default Ember.Controller.extend({

  // TODO: populate these on the fly
  regions: [{name: 'gp160'},
	    {name: 'signal'},
	    {name: 'c1'},
	    {name: 'v1'},
	    {name: 'v2'},
            {name: 'c2'},
	    {name: 'v3'},
	    {name: 'c3'},
	    {name: 'v4'},
	    {name: 'c4'},
	    {name: 'v5'},
            {name: 'c5'},
	    {name: 'fusion'},
	    {name: 'gp41ecto'},
	    {name: 'mper'},
            {name: 'gp41endo'}],
  selectedRegions: [{name: 'gp160'}],

  evoMetrics: [{name: 'ds_divergence'},
	       {name: 'dn_divergence'},
	       {name: 'total_divergence'},
	       {name: 'ds_diversity'},
	       {name: 'dn_diversity'},
	       {name: 'total_diversity'}],

  selectedEvoMetrics: [{name: 'ds_divergence'},
                       {name: 'dn_divergence'},
                       {name: 'total_divergence'},
                       {name: 'total_diversity'}],

  phenoMetrics: [{name: 'Length'},
		 {name: 'PNGS'},
                 {name: 'IsoelectricPoint'}],

  selectedPhenoMetrics: [{name: 'Length'},
			 {name: 'PNGS'}],

  firstEvoRegion: function() {
    let selectedRegions = this.get('selectedRegions');
    let n_evo = this.get('selectedEvoMetrics.length');
    if (n_evo > 1 && selectedRegions.length > 1) {
      return selectedRegions[0].name;
    }
    return "";
  }.property("selectedRegions.[]", "selectedEvoMetrics.length"),

  firstPhenoRegion: function() {
    let selectedRegions = this.get('selectedRegions');
    let n_pheno = this.get('selectedPhenoMetrics.length');
    if (n_pheno > 1 && selectedRegions.length > 1) {
      return selectedRegions[0].name;
    }
    return "";
  }.property("selectedRegions.[]", "selectedPhenoMetrics.length"),

  excludedPhenoMetric: function() {
    let n_pheno = this.get('selectedPhenoMetrics.length');
    if (n_pheno > 2) {
      return "extra metrics";
    }
    return "";
  }.property("selectedPhenoMetrics.length"),

  evoData: function() {
    let all_data = this.get('model.trajectory');
    let regions = this.get('selectedRegions');
    let metrics = this.get('selectedEvoMetrics');
    return prepData(all_data, regions, metrics);
  }.property('model.trajectory', 'selectedRegions.[]',
             'selectedEvoMetrics.[]'),

  _phenoData: function(index) {
    let all_data = this.get('model.trajectory');
    let regions = this.get('selectedRegions');
    let metrics = this.get('selectedPhenoMetrics');
    if (metrics.length > 2) {
      metrics = metrics.slice(0, 2);
    }
    if (regions.length === 0 || metrics.length === 0) {
      return [];
    }
    if (regions.length > 1) {
      return prepData(all_data, regions, metrics);
    } else if (metrics.length > 1) {
      return singleRegion(all_data, regions[0], [metrics[index]]);
    } else {
      return singleRegion(all_data, regions[0], metrics);
    }
  },

  phenoData: function() {
    let result = this._phenoData(0);
    return result;
  }.property('model.trajectory',
             'selectedRegions.[]',
             'selectedPhenoMetrics.[]'),

  phenoData2: function() {
    let result = [];
    if (this.get('selectedPhenoMetrics.length') > 1) {
      result = this._phenoData(1);
    }
    return result;
  }.property('model.trajectory',
             'selectedRegions.[]',
             'selectedPhenoMetrics.[]')
});


function prepData(all_data, regions, metrics) {
  if (regions.length === 0 || metrics.length === 0) {
    return [];
  }
  else if (regions.length > 1 && metrics.length > 1) {
    // just use first region
    return singleRegion(all_data, regions[0], metrics);    
  } else if (metrics.length == 1) {
    return singleMetric(all_data, regions, metrics[0]);
  } else if (regions.length == 1) {
    return singleRegion(all_data, regions[0], metrics);
  }
}


function singleMetric(all_data, regions, metric) {
  let result = [];
  // TODO: do this more functionally
  // possible with d3.nest?
  for (let i=0; i<regions.length; i++) {
    let region = regions[i];
    let series = {'name': region.name};
    let values = [];
    for (let k=0; k<all_data.length; k++) {
      if (region.name === all_data[k]["Segment"]) {
        let datum = {'x': all_data[k].Date,
                     'y': all_data[k][metric.name]};
        values.push(datum);
      }
    }
    values.sort((a, b) => a.x - b.x);
    series['values'] = values;
    result.push(series);
  }
  return result;
}


// TODO: code duplication
function singleRegion(all_data, region, metrics) {
  let result = [];
  for (let i=0; i<metrics.length; i++) {
    let metric = metrics[i];
    let series = {'name': metric.name};
    let values = [];
    for (let k=0; k<all_data.length; k++) {
      if (region.name === all_data[k]["Segment"]) {
        let datum = {'x': all_data[k].Date,
                     'y': all_data[k][metric.name]};
        values.push(datum);
      }
    }
    values.sort((a, b) => a.x - b.x);
    series['values'] = values;
    result.push(series);
  }
  return result;
}
