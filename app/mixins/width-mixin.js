import Ember from 'ember';

export default Ember.Mixin.create({
  didInsertElement: function()
  {
    var parentWidth = this.$().parents('div').width();
    this.set('width', parentWidth);
    this._super();
  },
});
