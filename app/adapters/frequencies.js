import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';

import FrequencyObject from '../models/frequency-object';


export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/frequencies';
    return request(url).then(function(data) {
      return FrequencyObject.create({data: data});
    });
  }
});
