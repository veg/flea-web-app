import Ember from 'ember';

export default Ember.Route.extend({
  setupController: function(controller, model){
    this._super(controller, model);
    controller.set('baseURL', this.router.get('baseURL'));
    controller.set('rootURL', this.router.get('rootURL'));
  }
});
