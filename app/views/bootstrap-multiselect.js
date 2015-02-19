import Ember from 'ember';

export default Ember.Select.extend({
  didInsertElement: function () {
    this.$().multiselect();
  },
  onSelectionChanged: Ember.observer('selection', function () {
    this.$().multiselect('rebuild');
  })
});
Ember.Handlebars.helper('bootstrap-multiselect', Ember.BootstrapMultiselect);
