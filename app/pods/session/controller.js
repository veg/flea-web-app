import Ember from 'ember';

export default Ember.Controller.extend({
  showTrajectory: function() {
    try {
      return this.get('model.runinfo.configuration.Tasks.hyphy_analysis') === "True";
    } catch (err) {
      return false;
    }
  }.property('model.runinfo.configuration.Tasks.hyphy_analysis')
});
