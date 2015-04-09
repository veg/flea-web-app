import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    var url = config.baseURL + 'assets/env_structure.pdb';
    return request(url).then(function(result) {
      var structure = pv.io.pdb(result);
      return structure;
    });
  }
});

