import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      rates: this.store.find('rates'),
      structure: this.store.find('structure')
    });
  },

  setupController: function(controller, model){
    this._super(controller, model);
    controller.set('rootURL', this.router.get('rootURL'));
  }
});
