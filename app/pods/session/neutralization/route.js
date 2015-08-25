import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      neutralization: this.store.find('neutralization', session_id),
      sequences: this.store.find('sequences', session_id),
      dates: this.store.find('dates', session_id)
    });
  }
});
