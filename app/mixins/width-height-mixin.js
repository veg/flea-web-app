import Ember from 'ember';
import ResizeAware from 'ember-resize/mixins/resize-aware';

export default Ember.Mixin.create(ResizeAware, {

  doResize(self) {
    let elt = self.$();
    if (elt) {
      let w = elt.parents('div').width();
      let h = elt.parents('div').height();
      self.set('width', w);
      self.set('height', h);
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
