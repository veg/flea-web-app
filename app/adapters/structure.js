import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function(session_id) {
    var url = '/assets/env_structure.pdb';
    return request(url).then(function(result) {
      var structure = pv.io.pdb(result);
      return structure;
    });
  }
});

