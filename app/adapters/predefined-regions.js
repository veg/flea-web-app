import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    var url = config.baseURL + 'assets/predefined_regions.json';
    return request(url).then(function(data) {
      var regions = data['regions'];
      // convert from 1-indexed [start, stop] to  0-index [start, stop)
      for (let k in regions) {
        regions[k].start -= 1;
      }
      return regions;
    });
  }
});

