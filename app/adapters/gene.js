import Ember from 'ember';
import request from 'ic-ajax';

var parse_date = d3.time.format("%Y%m%d");

export default Ember.Object.extend({
  find: function() {
    return request('/api/rates').then(function(result) {
      var new_result = {};
      for (var date in result) {
        if (result.hasOwnProperty(date)) {
          var d = parse_date.parse(date);
          new_result[d] = result[date];
        }
      }
      return new_result;
    });
  }
});
