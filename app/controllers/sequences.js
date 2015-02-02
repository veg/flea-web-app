import Ember from 'ember';

export default Ember.ObjectController.extend({

  selectedSequences: [],
  selectionSaved: function(param) {
    console.log(param);
  }
});
