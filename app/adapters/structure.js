import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function() {
    var url = config.rootURL + 'pdbs/env_structure';
    return this.get("ajax").request(url).then(function(result) {
      var structure = pv.io.pdb(result.data.join('\n'));
      return structure;
    });
  }
});
