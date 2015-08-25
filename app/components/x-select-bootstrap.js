import XSelect from 'emberx-select/components/x-select';

export default XSelect.extend({
  classNames: ['form-control'],
  makeMulti: false,

  didInsertElement: function () {
    this.setInitial();
    if (this.get('makeMulti') || this.get('multiple')) {
      this.$().multiselect();
    }
  },

  setInitial: function() {
    var values = this.get('value');
    if (!this.get('multiple')) {
      values = [values];
    }
    this.$('option').each(function() {
      var elt = $(this);
      if (values.indexOf(elt[0].value) > -1) {
        elt.prop('selected', true);
      }
    });
  }
});
