import Ember from 'ember';
import config from '../config/environment';


export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.apiURL + 'sessions/' + session_id + '/copynumbers';
    return this.get("ajax").request(url).then(function(result) {
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
