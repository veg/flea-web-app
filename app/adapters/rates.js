import Ember from 'ember';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

var RateInfo = Ember.Object.extend({
  date: null,
  rates: null,
});

export default Ember.Object.extend({
  find: function() {
    return request('/api/rates').then(function(result) {
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
      return new_result;
    });
  }
});
