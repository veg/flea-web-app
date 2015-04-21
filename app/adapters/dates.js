import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

import {parse_date} from '../utils/utils';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/dates';
    return request(url).then(function(result) {
      var new_result = {};
      for (let d in result) {
        if (!(result.hasOwnProperty(d))) {
          continue;
        }
        var parsed_d = parse_date(d);
        new_result[parsed_d] = result[d];
      }
      return new_result;
    });
  }
});
