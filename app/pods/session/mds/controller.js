import Ember from 'ember';

import { computed } from 'ember-decorators/object';
import { conditional } from 'ember-awesome-macros';

import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';

export default Ember.Controller.extend(ColorLabelMixin, {
  pattern: '',

  colorByMotif: false,

  selectedColorMap: conditional('colorByMotif', 'seqNameToMotifColor', 'seqNameToTimePointColor'),

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
