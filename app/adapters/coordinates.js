import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

import CoordinatesObject from 'flea-app/pods/coordinates-object/model';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/coordinates';
    return request(url).then(function(data) {
      return CoordinatesObject.create({data: data['coordinates']});
    });
  }
});
