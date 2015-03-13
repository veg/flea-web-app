import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var session_id = this.modelFor('session').session_id;
    return Ember.RSVP.hash({
      trees: this.store.find('trees', session_id),
      sequences: this.store.find('sequences', session_id),
    });
  }
});
