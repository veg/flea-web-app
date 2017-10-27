import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.apiURL + 'sessions/' + session_id + '/predefined_regions';
    return this.get("ajax").request(url).then(function(data) {
      var regions = data['regions'];
      // convert from 1-indexed [start, stop] to  0-index [start, stop)
      for (let i=0; i<regions.length; i++) {
        regions[i].start -= 1;
      }
      return regions;
    });
  }
});
