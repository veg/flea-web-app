import Ember from 'ember';
import config from '../../../config/environment';

export default Ember.Route.extend({
  fleaMode: config['fleaMode'],

  redirect() {
    if (this.get('fleaMode')) {
      this.transitionTo('session.mds');
    } else {
      this.transitionTo('session.protein');
    }
  }
});
