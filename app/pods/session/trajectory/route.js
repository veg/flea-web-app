import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    let session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      dates: this.store.find('dates', session_id),
      trajectory: this.store.find('trajectory', session_id),
      disabled: false,
    });
  }
});
