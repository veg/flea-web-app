import Ember from 'ember';
import request from 'ic-ajax';

var parse_date = d3.time.format("%Y%m%d");

export default Ember.Object.extend({
  find: function() {
    return request('/api/dates').then(function(result) {
      var new_result = {};
      for (var d in result) {
        if (!(result.hasOwnProperty(d))) {
          continue;
        }
        var parsed_d = parse_date.parse(d);
        new_result[parsed_d] = result[d];
      }
      return new_result;
    });
  }
});
