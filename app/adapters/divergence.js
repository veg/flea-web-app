import Ember from 'ember';
import config from '../config/environment';
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
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/divergence';
    return this.get("ajax").request(url).then(function(data) {
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
