import Ember from 'ember';
import request from 'ic-ajax';


export default Ember.Route.extend({
  model: function() {
    return request('/api/rates_pheno');
  }
});

