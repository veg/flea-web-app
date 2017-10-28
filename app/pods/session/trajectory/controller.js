import Ember from 'ember';
import { computed } from 'ember-decorators/object';

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

  @computed("selectedRegions.[]", "selectedEvoMetrics.length")
  firstEvoRegion(selectedRegions, n_evo) {
    if (n_evo > 1 && selectedRegions.length > 1) {
      return selectedRegions[0].name;
    }
    return "";
  },

  @computed("selectedRegions.[]", "selectedPhenoMetrics.length")
  firstPhenoRegion(selectedRegions, n_pheno) {
    if (n_pheno > 1 && selectedRegions.length > 1) {
      return selectedRegions[0].name;
    }
    return "";
  },

  @computed("selectedPhenoMetrics.length")
  excludedPhenoMetric(n_pheno) {
    if (n_pheno > 2) {
      return "extra metrics";
    }
    return "";
  },

  @computed('model.trajectory', 'selectedRegions.[]', 'selectedEvoMetrics.[]')
  evoData(all_data, regions, metrics) {
    return prepData(all_data, regions, metrics);
  },


  _phenoData(all_data, regions, metrics) {
    if (metrics.length > 2) {
      metrics = metrics.slice(0, 2);
    }
    return prepData(all_data, regions, metrics);
  },

  @computed('model.trajectory', 'selectedRegions.[]', 'selectedPhenoMetrics.[]')
  phenoData(all_data, regions, metrics) {
    return this._phenoData(all_data, regions, metrics);
  },

  @computed('model.trajectory', 'selectedRegions.[]', 'selectedPhenoMetrics.[]')
  phenoData2(all_data, regions, metrics) {
    let result = [];
    if (this.get('selectedPhenoMetrics.length') > 1) {
      result = this._phenoData(all_data, regions, metrics);
    }
    return result;
  },
});


function prepData(all_data, regions, metrics) {
  if (regions.length === 0 || metrics.length === 0) {
    return [];
  }
  else if (regions.length > 1) {
    if (metrics.length > 1) {
      // just use first region
      return singleRegion(all_data, regions[0], metrics);
    } else {
      return singleMetric(all_data, regions, metrics[0]);
    }
  } else {
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
