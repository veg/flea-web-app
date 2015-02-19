import Ember from 'ember';

export default Ember.Select.extend({
  allowMultiple: true,
  maxSelected: -1,

  didInsertElement: function () {
    this.$().multiselect();
    this.updateDisabled();
    this.updateMultiple();
  },

  updateDisabled: function() {
    // disable unselected options if user has already selected the max
    // number of option
    var maxSelected = this.get('maxSelected');
    if (maxSelected > 0) {
      var length = this.get('selection.length');
      if (length >= maxSelected) {
        // Disable all other checkboxes.
        var nonSelectedOptions = this.$('option').filter(function() {
          return !$(this).is(':selected');
        });
        nonSelectedOptions.each(function() {
          var input = $('input[value="' + $(this).val() + '"]');
          input.prop('disabled', true);
          input.parent('li').addClass('disabled');
        });
      }
      else {
        // Enable all checkboxes.
        this.$('option').each(function() {
          var input = $('input[value="' + $(this).val() + '"]');
          input.prop('disabled', false);
          input.parent('li').removeClass('disabled');
        });
      }
    }
  }.observes('selection.length', 'maxSelected'),

  updateMultiple: function() {
    if (this.get('allowMultiple')) {
      this.$().attr('multiple', 'multiple');
    } else {
      this.$().removeAttr('multiple');
    }
    this.$().multiselect('rebuild');
  }.observes('allowMultiple')
});
Ember.Handlebars.helper('bootstrap-multiselect', Ember.BootstrapMultiselect);
