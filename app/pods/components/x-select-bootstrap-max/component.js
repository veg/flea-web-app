import XSelectBootstrap from '../x-select-bootstrap/component';

// Only allows up to a certain number of selected items
export default XSelectBootstrap.extend({
  maxSelected: -1,
  multiple: true,

  didInsertElement: function () {
    this.setInitial();
    this.$().multiselect();
    this.updateDisabled();
  },

  updateDisabled: function() {
    // disable unselected options if user has already selected the max
    // number of option
    var maxSelected = this.get('maxSelected');
    if (maxSelected > 0) {
      if (this.get('value.length') >= maxSelected) {
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
  }.observes('value.length', 'maxSelected'),
});
