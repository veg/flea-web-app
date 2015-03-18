import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';


var TurnoverInfo = Ember.Object.extend({
  date: null,
  turnover: null
});


var TurnoverObject = Ember.Object.extend({
  data: [],

  sortedTurnover: function() {
    var data = this.get('data');
    data.sort(function (a,b) {return a.date - b.date;});
    return data;
  }.property('data')
});

export default Ember.Object.extend({
  find: function(session_id) {
    var url = config.baseURL + 'data/' + session_id + '/turnover';
    return request(url).then(function(data) {
      var result = [];
      for (var k in data) {
        result.push(TurnoverInfo.create({
          date: parse_date(k),
          turnover: data[k]
        }));
      }
      return TurnoverObject.create({
        data: result
      });
    });
  }
});
