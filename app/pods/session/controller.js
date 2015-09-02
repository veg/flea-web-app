import Ember from 'ember';

export default Ember.Controller.extend({
  showTrajectory: function() {
    return this.get('model.runinfo.configuration.Tasks.hyphy_analysis') === "True";
  }.property('model.runinfo')
});
