import Ember from 'ember';
import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';
import { action } from 'ember-decorators/object';

export default Ember.Controller.extend(ColorLabelMixin, {

  showCopynumber: true,
  overlapNodes: true,
  radialLayout: true,

  sortState: 'ascending',
  heightScale: 1.0,

  hideCopynumber: Ember.computed.not('showCopynumber'),

  @action
  setSortState(val) {
    this.set('sortState', val);
  }
});
