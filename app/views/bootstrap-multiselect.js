import Ember from 'ember';

export default Ember.Select.extend({
  allowMultiple: true,

  didInsertElement: function () {
    this.$().multiselect();
  },

  updateMultiple: function() {
    if (this.get('allowMultiple')) {
      console.log('adding multiple');
      this.$().attr('multiple', 'multiple');
    } else {
      console.log('removing multiple');
      this.$().removeAttr('multiple');
    }
    this.$().multiselect('rebuild');
  }.observes('allowMultiple')
});
Ember.Handlebars.helper('bootstrap-multiselect', Ember.BootstrapMultiselect);
