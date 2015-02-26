import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      sequences: this.store.find('sequences'),
      frequencies: this.store.find('frequencies'),
      rates: this.store.find('rates')
    });
  }
});
