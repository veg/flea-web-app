import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    let session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      rates: this.store.find('rates', session_id),
      sequences: this.store.find('sequences', session_id),
      structure: this.store.find('structure', session_id),
      coordinates: this.store.find('coordinates', session_id),
      divergence: this.store.find('divergence', session_id),
      dates: this.store.find('dates', session_id)
    });
  },
});
