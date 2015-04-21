import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

export default Ember.Object.extend({
  // gets rates-pheno.json and formats it to Dates and numbers.
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/rates_pheno';
    return request(url).then(function(result) {
      result.forEach (function (d) {
        d.Date = parse_date(String(d.Date));
        for (let k in d) {
          if (!d.hasOwnProperty(k)) {
            continue;
          }
          if (k !== "Segment" && k !== "Date") {
            d[k] = +d[k];
          }
        }
      });
      return result;
    });
  }
});
