import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    let session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      sequences: this.store.find('sequences', session_id),
      coordinates: this.store.find('coordinates', session_id),
      rates: this.store.find('rates', session_id),
      copynumbers: this.store.find('copynumbers', session_id),
      predefinedRegions: this.store.find('predefined-regions', session_id),
      dates: this.store.find('dates', session_id)
    });
  }
});
