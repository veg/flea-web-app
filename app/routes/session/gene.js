import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      rates: this.store.find('rates', session_id),
      structure: this.store.find('structure', session_id),
      frequencies: this.store.find('frequencies', session_id)
    });
  },
});
