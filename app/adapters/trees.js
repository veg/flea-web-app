import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    let url = config.apiURL + 'sessions/' + session_id + '/trees';
    return this.get("ajax").request(url).then(function(result) {
      let tree = R.prop('tree', result);
      if (tree) {
	return tree;
      }
      tree = R.path(['Combined', 'all', 'Maximum Likelihood'], result);
      if (tree) {
	return tree;
      }
      throw "missing tree";
    });
  }
});
