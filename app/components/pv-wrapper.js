import Ember from 'ember';

export default Ember.Component.extend({
  didInsertElement: function () {
    var options = {
      width: 1100,
      height: 800,
      antialias: true,
      quality : 'medium'
    };
    var viewer = pv.Viewer(this.$()[0], options);
    var structure = this.get('structure');
    viewer.cartoon('protein', structure, { color : pv.color.ssSuccession() });
    viewer.fitTo(structure);
  }.observes('structure')
});
