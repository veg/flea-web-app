import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      neutralization: this.store.find('neutralization'),
      dates: this.store.find('dates'),
    });
  }
});
