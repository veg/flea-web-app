import Ember from 'ember';
import request from 'ic-ajax';

var parse_date = d3.time.format("%Y%m%d");

var GeneInfo = Ember.Object.extend({
  name: null,
  data: null,
});

export default Ember.Object.extend({
  find: function() {
    return request('/api/rates').then(function(result) {
      var new_result = [];
      for (var name in result) {
        if (result.hasOwnProperty(name)) {
          var d = name;
          if (name !== "Combined") {
            d = parse_date.parse(name);
          }
          new_result.push(GeneInfo.create({
            name: d,
            data: result[name]
          }));
        }
      }
      return new_result;
    });
  }
});
