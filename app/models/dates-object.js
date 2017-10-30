import Ember from 'ember';
import { computed } from 'ember-decorators/object';

export default Ember.Object.extend({
  dates: [],

  @computed('dates.[]')
  dateToName(dates) {
    return R.zipObj(R.pluck('date', dates),
		    R.pluck('name', dates))
  },

  @computed('dates.[]')
  sortedDateObjs(dates) {
    return R.sort((a, b) => a.date - b.date, dates);
  },

  @computed('sortedDateObjs')
  sortedVisitCodes(dates) {
    return R.pluck('name', dates);
  },

  @computed('sortedDateObjs')
  sortedDates(dates) {
    return R.pluck('date', dates);
  }

});
