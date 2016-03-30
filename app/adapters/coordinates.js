import Ember from 'ember';
import config from '../config/environment';

import CoordinatesObject from 'flea-app/models/coordinates-object';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/coordinates';
    return this.get('ajax').request(url).then(function(data) {
      return CoordinatesObject.create({data: data['coordinates']});
    });
  }
});
