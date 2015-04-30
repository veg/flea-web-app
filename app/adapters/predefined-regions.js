import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    var url = config.baseURL + 'assets/predefined_regions.json';
    return request(url).then(d => d["regions"]);
  }
});

