import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from 'flea-app/utils/utils';


var DivergenceInfo = Ember.Object.extend({
  date: null,
  divergence: null
});


var DivergenceObject = Ember.Object.extend({
  data: [],

  sortedDivergence: function() {
    var data = this.get('data');
    data.sort((a,b) => a.date - b.date);
    return data;
  }.property('data')
});

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/divergence';
    return request(url).then(function(data) {
      var result = [];
      delete data['readCount'];
      for (let k in data) {
        result.push(DivergenceInfo.create({
          date: parse_date(k),
          divergence: data[k],
        }));
      }
      return DivergenceObject.create({
        data: result,
      });
    });
  }
});
