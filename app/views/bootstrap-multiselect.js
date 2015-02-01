import Ember from 'ember';

export default Ember.Select.extend({
  multiple:true,
  didInsertElement: function () {
    this.$().multiselect(this.get('options'));
  },
  onSelectionChanged: Ember.observer('selection', function () {
    this.$().multiselect('rebuild');
  })
});
Ember.Handlebars.helper('bootstrap-multiselect', Ember.BootstrapMultiselect);
