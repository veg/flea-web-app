import Ember from 'ember';
import config from '../../config/environment';
import { computed } from 'ember-decorators/object';

export default Ember.Controller.extend({

  fleaMode: config['fleaMode'],

  @computed('model.session_id')
  downloadURL(sessionId) {
    return config.apiURL + 'zips/' + sessionId + ".zip";
  },

});
