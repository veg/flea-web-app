import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    return request('/api/structure').then(function(result) {
      var structure = pv.io.pdb(result);
      return structure;
    });
  }
});

