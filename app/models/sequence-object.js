import Ember from 'ember';
import { split } from 'ember-awesome-macros/string';
import raw from 'ember-macro-helpers/raw';

export default Ember.Object.extend({
  id: null,
  date: null,
  sequence: null,

  aminoAcids: split('sequence', raw(''))

});
