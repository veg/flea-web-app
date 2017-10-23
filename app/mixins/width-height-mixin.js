import Ember from 'ember';
import ResizeAware from 'ember-resize/mixins/resize-aware';

export default Ember.Mixin.create(ResizeAware, {

  doResize(self) {
    let w = self.$().parents('div').width();
    let h = self.$().parents('div').height();
    self.set('width', w);
    self.set('height', h);
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
    this.doResize(self);
    this._super(...arguments);
  }

});
