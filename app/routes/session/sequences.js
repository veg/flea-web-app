import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      sequences: this.store.find('sequences', session_id),
      frequencies: this.store.find('frequencies', session_id),
      rates: this.store.find('rates', session_id),
      predefinedRegions: this.store.find('predefined-regions', session_id)
    });
  }
});
