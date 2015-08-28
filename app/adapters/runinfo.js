import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/runinfo';
    return request(url);
  }
});
