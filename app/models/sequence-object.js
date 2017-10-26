import Ember from 'ember';

export default Ember.Object.extend({
  id: null,
  date: null,
  sequence: null,

  aminoAcids: function() {
    return this.get('sequence').split('');
  }.property('sequence.[]')
});
