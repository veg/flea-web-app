import Ember from 'ember';
import ColorLabelMixin from 'flea-web-app/mixins/color-label-mixin';
import { computed, action } from 'ember-decorators/object';

export default Ember.Controller.extend(ColorLabelMixin, {

  showCopynumber: true,
  overlapNodes: true,
  radialLayout: true,

  sortState: 'ascending',
  heightScale: 1.0,

  hideCopynumber: Ember.computed.not('showCopynumber'),

  @computed('model.sequences.observed.[]')
  seqNameToCopynumber(seqs) {
    return R.zipObj(R.pluck('name', seqs),
                    R.pluck('copynumber', seqs));
  },

  @action
  setSortState(val) {
    this.set('sortState', val);
  }
});
