import Ember from 'ember';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

export default Ember.Object.extend({
  // gets rates-pheno.json and formats it to Dates and numbers.
  find: function() {
    return request('/api/rates_pheno').then(function(result) {
      result.forEach (function (d) {
        d.Date = parse_date(String(d.Date));
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
