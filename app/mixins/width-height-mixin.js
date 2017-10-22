import Ember from 'ember';
import ResizeAware from 'ember-resize/mixins/resize-aware';

export default Ember.Mixin.create(ResizeAware, {

  doResize() {
    let w = this.$().parents('div').width();
    let h = this.$().parents('div').height();
    this.set('width', w);
    this.set('height', h);
    console.log(`WidthHeightMixin. ${w}x${h}`);
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
