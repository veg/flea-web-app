import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      rates: this.store.find('rates'),
      structure: this.store.find('structure'),
      sequences: this.store.find('sequences'),
      frequencies: this.store.find('frequencies'),
      trajectory: this.store.find('trajectory'),
      trees: this.store.find('trees')
    });
  },

  setupController: function(controller, model){
    this._super(controller, model);
    controller.set('rootURL', this.router.get('rootURL'));
  }
});
