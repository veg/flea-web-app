import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    return Ember.RSVP.hash({
      session_id: params.session_id,
      runinfo: this.store.find('runinfo', params.session_id)
    });
  }
});
