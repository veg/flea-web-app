import Ember from 'ember';
import request from 'ic-ajax';

export default Ember.Object.extend({
  find: function() {
    return request('/api/neutralization').then(function(result) {
      return result;
    });
  }
});