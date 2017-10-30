import Ember from 'ember';
import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';
import { computed } from 'ember-decorators/object';

export default Ember.Controller.extend(ColorLabelMixin, {
  pattern: '',

  @computed('pattern')
  highlightedNodes(pattern) {
    if (!pattern) {
      return [];
    }
    // split on whitespace or comma
    let patterns = pattern.split(/[ ,]+/).filter(Boolean);
    let seqs = this.get('model.sequences.observed');
    let result = [];
    for (let i=0; i<seqs.length; i++) {
      for (let j=0; j<patterns.length; j++) {
        if (seqs[i].name.search(patterns[j]) >= 0) {
          result.push(seqs[i].name);
        }
      }
    }
    return new Set(result);
  }

});
