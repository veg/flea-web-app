import Ember from 'ember';

export default Ember.Route.extend({
  redirect: function() {
    var hyphy = this.get('model.runinfo.configuration.Tasks.hyphy_analysis');
    if (hyphy) {
      this.transitionTo('session.trajectory');
    } else {
      this.transitionTo('session.gene');
    }
  }
});
