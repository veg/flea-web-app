import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.find('neutralization');
  },
  setupController: function(controller, model){
    controller.set('sequences', this.store.find('sequences'));
    controller.set('dates', this.store.find('dates'));
  }
});
