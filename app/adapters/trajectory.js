import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  // gets rates-pheno.json and formats it to Dates and numbers.
  find: function() {
    return request('/api/rates_pheno').then(function(result) {
      var parse_date = d3.time.format("%Y%m%d");
      result.forEach (function (d) {
        d.Date = parse_date.parse(String(d.Date));
        for (var k in d) {
          if (k !== "Segment" && k !== "Date") {
            d[k] = +d[k];
          }
        }
      });
      return result;
    });
  }
});
