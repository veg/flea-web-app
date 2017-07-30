import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.apiURL + 'sessions/' + session_id + '/manifold';
    return this.get("ajax").request(url).then(function(data) {
      let result = [];
      for (let id in data) {
        if (!data.hasOwnProperty(id)) {
          continue;
        }
	let coords = data[id];
	result.push({
	  name: id,
	  x: coords[0],
	  y: coords[1],
	});
      }
      return result;
    });
  }
});
