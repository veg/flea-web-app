import Ember from 'ember';

export default Ember.Mixin.create({

  doResize(self) {
    let w = self.$().parents('div').width();
    self.set('width', w);
    console.log(`WidthMixin. ${w}x${w}`);
  },

  init() {
    this._super(...arguments);
    let self = this;
    this.get('resizeService').on('didResize', (e) => {
      this.doResize(self);
    });
    this.get('resizeService').on('debouncedDidResize', (e) => {
      this.doResize(self);
    });
  },

  didInsertElement() {
    let self = this;
    this.doResize(this);
    this._super(...arguments);
  }

});
