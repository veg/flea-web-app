import Ember from 'ember';
import config from '../config/environment';
import {parse_date} from 'flea-app/utils/utils';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.rootURL + 'data/' + session_id + '/trees';
    return this.get("ajax").request(url).then(function(result) {
      if (!result.hasOwnProperty('tree')) {
	throw 'missing tree';
      }
      return result['tree'];
    });
  }
});
