import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.rootURL + 'data/' + session_id + '/runinfo';
    return this.get("ajax").request(url).then(function(response) {
      return response;
    }, function() {
      return null;
    });
  }
});
