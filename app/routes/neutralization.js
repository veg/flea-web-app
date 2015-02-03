import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      neutralization: this.store.find('neutralization'),
      sequences: this.store.find('sequences'),
      dates: this.store.find('dates')
    });
  }
});
