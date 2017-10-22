import Ember from 'ember';

export default Ember.Mixin.create({

  doResize() {
    let w = this.$().parents('div').width();
    this.set('width', w);
    console.log(`WidthMixin. ${w}x${w}`);
  },

  init() {
    this._super(...arguments);
    this.get('resizeService').on('didResize', (e) => {
      this.doResize();
    });
    this.get('resizeService').on('debouncedDidResize', (e) => {
      this.doResize();
    });
  },

  didInsertElement() {
    this.doResize();
    this._super(...arguments);
  }

});
