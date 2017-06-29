import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    let show_trajectory = this.controllerFor('session').get('showTrajectory');
    if (show_trajectory) {
      let session_id = this.modelFor('session').session_id;
      return Ember.RSVP.hash({
	dates: this.store.find('dates', session_id),
	trajectory: this.store.find('trajectory', session_id),
	disabled: false,
      });
    } else {
      return {disabled: true};
    }
  }
});
