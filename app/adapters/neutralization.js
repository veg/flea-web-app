import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'api/' + session_id + '/neutralization';
    return request(url).then(function(result) {
      return result;
    });
  }
});
