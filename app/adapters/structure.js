import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    return request('http://pdb.org/pdb/files/4nco.pdb').then(function(result) {
      var structure = pv.io.pdb(result);
      return structure;
    });
  }
});

