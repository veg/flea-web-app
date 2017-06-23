import Ember from 'ember';
import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';

export default Ember.Controller.extend(ColorLabelMixin, {

  showCopynumber: true,
  overlapNodes: true,
  radialLayout: false,

  sortState: 'ascending',
  heightScale: 1.0,

  hideCopynumber: Ember.computed.not('showCopynumber'),

  actions: {
    setSortState: function(val) {
      this.set('sortState', val);
    },
  },
});
