import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    let url = config.apiURL + 'sessions/' + session_id + '/neutralization';
    return this.get("ajax").request(url).then(function(result) {
      return result;
    });
  }
});
