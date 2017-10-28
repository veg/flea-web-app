import Ember from 'ember';
import config from '../config/environment';
import {parse_date} from 'flea-app/utils/utils';
import { computed } from 'ember-decorators/object';

let RateInfo = Ember.Object.extend({
  date: null,
  rates: null,
});

let RatesObject = Ember.Object.extend({
  data: [],
  exists: false,

  @computed('data.[]')
  sortedRates(rates) {
    let timepoints = rates.filter(d => d.date !== 'Combined');
    let combined = rates.filter(d => d.date === 'Combined');
    timepoints.sort((a,b) => a.date - b.date);
    timepoints.splice(0, 0, combined[0]);
    return timepoints;
  },

  // _positive_selection
  @computed('sortedRates')
  positiveSelection(sorted) {
    if (!this.get('exists')) {
      // FIXME: actually report that it failed
      return [[]];
    }
    return sorted.map(d => positive_selection_positions(d.rates));
  }
});


function positive_selection_positions (mx) {
  // TODO: do not hardcode indices or thresholds
  return mx.map((d, i) => [i, d[2]])
    .filter(d => d[1] >= 0.95)
    .map(d => d[0]);
}

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    let url = config.apiURL + 'sessions/' + session_id + '/rates';
    return this.get("ajax").request(url).then(function(result) {
      let new_result = [];
      for (let key in result) {
        if (result.hasOwnProperty(key)) {
          let d = key;
          let array = eval(result[key]);  // FIXME: remove eval
          if (key !== "Combined") {
            d = parse_date(key);
          }
          new_result.push(RateInfo.create({
            date: d,
            rates: array
          }));
        }
      }
      return RatesObject.create({data: new_result, exists: true});
    }, function() {
      return RatesObject.create();
    });
  }
});
