import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    let session_id = this.modelFor('session').session_id;
    return this.store.find('session', session_id);
  },
});
