import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function() {
    var url = config.baseURL + 'assets/predefined_regions.json';
    return this.get("ajax").request(url).then(function(data) {
      var regions = data['regions'];
      // convert from 1-indexed [start, stop] to  0-index [start, stop)
      for (let k in regions) {
        regions[k].start -= 1;
      }
      return regions;
    });
  }
});
