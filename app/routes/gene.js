import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      rates: this.store.find('rates'),
      frequencies: this.store.find('frequencies'),
    });
  }
});
