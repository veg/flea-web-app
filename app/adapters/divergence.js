import Ember from 'ember';
import config from '../config/environment';
import {parse_date} from 'flea-app/utils/utils';
import { computed } from 'ember-decorators/object';


var DivergenceInfo = Ember.Object.extend({
  date: null,
  divergence: null
});


var DivergenceObject = Ember.Object.extend({
  data: [],

  @computed('data')
  sortedDivergence(data) {
    data.sort((a,b) => a.date - b.date);
    // add combined, which is just max of all time points
    let maxDivergence = new Array(data[0].divergence.length).fill(0);
    for (let i=0; i<data.length; i++) {
      for (let j=0; j<maxDivergence.length; j++) {
	maxDivergence[j] = Math.max(maxDivergence[j], data[i].divergence[j]);
      }
    }

    let combined = DivergenceInfo.create({
      date: 'Combined',
      divergence: maxDivergence,
    });
    data.unshift(combined);
    return data;
  }
});

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function(session_id) {
    var url = config.apiURL + 'sessions/' + session_id + '/divergence';
    return this.get("ajax").request(url).then(data => {
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
