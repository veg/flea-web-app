import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

var RateInfo = Ember.Object.extend({
  date: null,
  rates: null,
});

var RatesObject = Ember.Object.extend({
  data: [],

  sortedRates: function () {
    var rates = this.get('data');
    var timepoints = rates.filter(function(d) {return d.date !== 'Combined';});
    var combined = rates.filter(function(d) {return d.date === 'Combined';});
    timepoints.sort(function (a,b) {return a.date - b.date;});
    timepoints.splice(0, 0, combined[0]);
    return timepoints;
  }.property('data.@each'),

  // _positive_selection
  positiveSelection: function() {
    var data = this.get('sortedRates');
    return data.map(function(d) {
      return positive_selection_positions(d.rates);
    });
  }.property('sortedRates'),
});


// 1-based indexing
function positive_selection_positions (mx) {
  return mx.map (function (d, i) {
    return [i, d[2]];
  }).filter (function (d) {
    return d [1] >= 0.95;
  }).map (function (d) {
    return d[0] + 1;
  });
}

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/rates';
    return request(url).then(function(result) {
      var new_result = [];
      for (var name in result) {
        if (result.hasOwnProperty(name)) {
          var d = name;
          var array = eval(result[name]);  // FIXME: remove eval
          if (name !== "Combined") {
            d = parse_date(name);
          }
          new_result.push(RateInfo.create({
            date: d,
            rates: array
          }));
        }
      }
      return RatesObject.create({data: new_result});
    });
  }
});
