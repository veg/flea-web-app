import Ember from 'ember';
import config from '../../config/environment';
import { computed } from 'ember-decorators/object';

export default Ember.Controller.extend({

  fleaMode: config['fleaMode'],

  @computed('model.session_id')
  downloadURL(sessionId) {
    return config.apiURL + 'zips/' + sessionId + ".zip";
  },

  @computed('model.session.visualizations', 'fleaMode')
  shouldShow(viz, fleaMode) {
    viz = viz || {};
    let result = {
      "mds": true,
      "evolutionary_trajectory": true,
      "protein": true,
      "sequences": true,
      "trees": true
    };
    if (!fleaMode) {
      result['mds'] = false;
      result['evolutionary_trajectory'] = false;
      result['trees'] = false;
    }
    return R.merge(result, viz);
  },
});
