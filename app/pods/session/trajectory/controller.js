import Ember from 'ember';
import { computed } from 'ember-decorators/object';

import { parse_date, filterWithKeys } from 'flea-web-app/utils/utils';

export default Ember.Controller.extend({

  // TODO: do not hardcode defaults
  selectedRegionNames: ['gp160'],
  selectedEvoNames: ['dS divergence', 'dN divergence', 'Total divergence', 'Total diversity'],
  selectedPhenoNames: ['Length', 'PNGS'],

  initialized: false,

  @computed('model.regionMetrics')
  regionNames(regions) {
    return R.uniq(R.pluck('name', regions));
  },

  @computed('model.regionMetrics')
  evoNames(regions) {
    // assumes all have the same metrics
    return R.pluck('name', regions[0]['evo_metrics']);
  },

  @computed('model.regionMetrics')
  phenoNames(regions) {
    // assumes all have the same metrics
    return R.pluck('name', regions[0]['pheno_metrics']);

  },

  selectedMetrics(regions, regionNames, metricNames, metricKey) {
    let selectedRegions = R.filter(r => R.contains(r['name'], regionNames), regions);
    // filter out all unselected metrics
    // TODO: do this with a lens
    let selected = R.map(
      region => {
	let result = {
	  'name': region['name'],
	  'date': region['date']
	};
	result[metricKey] = R.filter(m => R.contains(m['name'], metricNames), region[metricKey]);
	return result;
      },
      selectedRegions
    );
    if (R.any(r => r[metricKey].length === 0, selected)) {
      return [];
    }
    return selected;
  },

  @computed('selectedRegionNames.[]',
	    'selectedEvoNames.[]')
  selectedRegionNamesForEvo(regionNames, evoNames) {
    if (evoNames.length > 1 && regionNames.length > 1) {
      return R.take(1, regionNames);
    }
    return regionNames;
  },

  @computed('selectedRegionNames.[]',
	    'selectedPhenoNames.[]')
  selectedRegionNamesForPheno(regionNames, phenoNames) {
    if (phenoNames.length > 1 && regionNames.length > 1) {
      return R.take(1, regionNames);
    }
    return regionNames;
  },

  @computed('model.regionMetrics.[]',
	    'selectedRegionNamesForEvo.[]',
	    'selectedEvoNames.[]')
  selectedEvoMetrics(regions, regionNames, evoNames) {
    return this.selectedMetrics(regions, regionNames,
				evoNames, 'evo_metrics');
  },

  @computed('model.regionMetrics.[]',
	    'selectedRegionNamesForPheno.[]',
	    'selectedPhenoNames.[]')
  selectedPhenoMetric1(regions, regionNames, phenoNames) {
    if (phenoNames.length === 0) {
      return [];
    }
    return this.selectedMetrics(regions, regionNames,
				[phenoNames[0]], 'pheno_metrics');
  },

  @computed('model.regionMetrics.[]',
	    'selectedRegionNamesForPheno.[]',
	    'selectedPhenoNames.[]')
  selectedPhenoMetric2(regions, regionNames, phenoNames) {
    if (phenoNames.length < 2) {
      return []
    }
    return this.selectedMetrics(regions, regionNames,
				[phenoNames[1]], 'pheno_metrics');
  },

  @computed("selectedRegionNames.[]", "selectedEvoNames.length")
  firstEvoRegion(regionNames, n_evo) {
    if (n_evo > 1 && regionNames.length > 1) {
      return regionNames[0];
    }
    return "";
  },

  @computed("selectedRegionNames.[]", "selectedPhenoNames.length")
  firstPhenoRegion(regionNames, n_pheno) {
    if (n_pheno > 1 && regionNames.length > 1) {
      return regionNames[0];
    }
    return "";
  },

  @computed("selectedPhenoNames.[]")
  excludedPhenoMetricNames(names) {
    return R.drop(2, names);
  },

  getData(metrics, metricKey, forceOverMetrics) {
    if (metrics.length === 0) {
      return [];
    }

    // flatten to {region, metric, date, value}
    let points = R.flatten(
      R.map(
	region => R.map(
	  metric => {
	    return {
	      'region': region['name'],
	      'date': region['date'],
	      'metric': metric['name'],
	      'value': metric['value'],
	    };
	  },
	  region[metricKey]
	),
	metrics
      )
    );
    let regionNames = R.uniq(R.pluck('name', metrics));
    let getNames = R.pipe(R.view(R.lensIndex(0)),
			  R.prop(metricKey),
			  R.pluck('name'));
    let metricNames = R.uniq(getNames(metrics));
    // use metric names if there is more than one metric
    let isOverMetrics = metricNames.length > 1 || forceOverMetrics
    let namer = isOverMetrics ? R.prop('metric') : R.prop('region')
    let groupKey = isOverMetrics ? 'metric' : 'region'
    let groupedPoints = R.groupBy(R.prop(groupKey), points);
    // make a line for each group
    let result = R.mapObjIndexed(
      (gpoints, key) => {
	return {
	  'name': namer(gpoints[0]),
	  'values': R.map(p => {
	    return {
	      x: parse_date(p['date']),
	      y: p['value']
	    };
	  }, gpoints)
	}
      },
      groupedPoints);
    return R.values(result);
  },

  @computed('selectedEvoMetrics.[]')
  evoData(metrics) {
    return this.getData(metrics, 'evo_metrics', false);
  },

  @computed('selectedPhenoMetric1.[]', 'selectedPhenoMetric2.length')
  phenoData1(metrics, n_metrics) {
    let forceOverMetrics = n_metrics > 1
    return this.getData(metrics, 'pheno_metrics', forceOverMetrics);
  },

  @computed('selectedPhenoMetric2.[]')
  phenoData2(metrics) {
    return this.getData(metrics, 'pheno_metrics', true);
  }

});
