import Ember from 'ember';

export default Ember.Controller.extend({
  showTrajectory: function() {
    try {
      var val = this.get('model.runinfo.configuration.Tasks.hyphy_analysis');
      // used to be a string, but now it is a JSON bool. Have to check both.
      if (val === "True") {
        return true;
      }
      if (val === "False") {
        return false;
      }
      return val;
    } catch (err) {
      return false;
    }
  }.property('model.runinfo.configuration.Tasks.hyphy_analysis')
});
