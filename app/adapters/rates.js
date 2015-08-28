import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from 'flea-app/utils/utils';

var RateInfo = Ember.Object.extend({
  date: null,
  rates: null,
});

var RatesObject = Ember.Object.extend({
  data: [],
  exists: false,

  sortedRates: function () {
    var rates = this.get('data');
    var timepoints = rates.filter(d => d.date !== 'Combined');
    var combined = rates.filter(d => d.date === 'Combined');
    timepoints.sort((a,b) => a.date - b.date);
    timepoints.splice(0, 0, combined[0]);
    return timepoints;
  }.property('data.[]'),

  // _positive_selection
  positiveSelection: function() {
    if (!this.get('exists')) {
      // FIXME: actually report that it failed
      return [[]];
    }
    var sorted = this.get('sortedRates');
    return sorted.map(d => positive_selection_positions(d.rates));
  }.property('sortedRates'),
});


function positive_selection_positions (mx) {
  return mx.map((d, i) => [i, d[2]])
    .filter(d => d[1] >= 0.95)
    .map(d => d[0]);
}

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/rates';
    return request(url).then(function(result) {
      var new_result = [];
      for (let key in result) {
        if (result.hasOwnProperty(key)) {
          var d = key;
          var array = eval(result[key]);  // FIXME: remove eval
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
