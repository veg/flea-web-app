import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

import {parse_date} from '../utils/utils';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/copynumbers';
    return request(url).then(function(result) {
      for (let d in result) {
        if (!(result.hasOwnProperty(d))) {
          continue;
        }
        result[d] = parseInt(result[d]);
      }
      return result;
    });
  }
});
