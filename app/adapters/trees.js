import Ember from 'ember';
import config from '../config/environment';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.apiURL + 'sessions/' + session_id + '/trees';
    return this.get("ajax").request(url).then(function(result) {
      let tree = _.get(result, 'tree');
      if (tree) {
	return tree;
      }
      tree = _.get(result, ['Combined', 'all', 'Maximum Likelihood']);
      if (tree) {
	return tree;
      }
      throw "missing tree";
    });
  }
});
