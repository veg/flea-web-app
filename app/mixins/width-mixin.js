import Ember from 'ember';

export default Ember.Mixin.create({

  doResize(self) {
    let elt = self.$();
    if (elt) {
      let w = elt.parents('div').width();
      self.set('width', w);
    }
  },

  init() {
    this._super(...arguments);
    let self = this;
    this.get('resizeService').on('didResize', () => {
      this.doResize(self);
    });
    this.get('resizeService').on('debouncedDidResize', () => {
      this.doResize(self);
    });
  },

  didInsertElement() {
    this.doResize(this);
    this._super(...arguments);
  }

});
