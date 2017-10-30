import Ember from 'ember';
import { split } from 'ember-awesome-macros/string';
import raw from 'ember-macro-helpers/raw';

export default Ember.Object.extend({
  name: null,
  sequence: null,
  date: null,
  copynumber: null,
  x: null,
  y: null,

  aminoAcids: split('sequence', raw(''))

});
