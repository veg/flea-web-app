import Ember from 'ember';

export default Ember.Route.extend({
  setupController: function(controller, model){
    this._super(controller, model);
    controller.set('rootURL', this.router.get('rootURL'));
  }
});
