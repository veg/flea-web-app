import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = '/api/' + session_id + '/frequencies';
    return request(url);
  }
});
