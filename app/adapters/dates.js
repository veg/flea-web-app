import Ember from 'ember';
import config from '../config/environment';

import {parse_date} from 'flea-app/utils/utils';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.rootURL + 'data/' + session_id + '/dates';
    return this.get("ajax").request(url).then(function(result) {
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
