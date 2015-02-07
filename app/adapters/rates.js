import Ember from 'ember';
import request from 'ic-ajax';

var parse_date = d3.time.format("%Y%m%d");

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
          var array = result[name];
          if (name == "Combined") {
            array = eval(array);
          } else {
            d = parse_date.parse(name);
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
