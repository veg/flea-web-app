import Ember from 'ember';
import ColorLabelMixin from 'flea-app/mixins/color-label-mixin';

export default Ember.Controller.extend(ColorLabelMixin, {
  pattern: '',

  highlightedNodes: function() {
    let pattern = this.get('pattern');
    if (!pattern) {
      return [];
    }
    let seqs = this.get('model.sequences.observed');
    return new Set(seqs.map(s => s.id).filter(n => n.search(pattern) >= 0));
  }.property('pattern'),
});
