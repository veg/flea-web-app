import Ember from 'ember';

export default Ember.Mixin.create({
  didInsertElement: function()
  {
    this._super();
    var parentWidth = this.$().parents('div').width();
    this.set('width', parentWidth);
  },
});
