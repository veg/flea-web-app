import Ember from 'ember';

export default Ember.Route.extend({
  model(params) {
    let session_id = params.session_id;
    return Ember.RSVP.hash({
      session_id: params.session_id,
      session: this.store.find('session', session_id)
    });
  }
});
