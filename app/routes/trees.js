import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      trees: this.store.find('trees'),
      sequences: this.store.find('sequences'),
    });
  }
});
