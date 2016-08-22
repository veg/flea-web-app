import Ember from 'ember';
import config from '../config/environment';
import {parse_date} from 'flea-app/utils/utils';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),


  find: function(session_id) {
    var url = config.rootURL + 'data/' + session_id + '/trees';
    return this.get("ajax").request(url).then(function(result) {
      var trees = [];
      for (let date in result) {
        if (!result.hasOwnProperty(date)) {
          continue;
        }
        for (let region in result[date]) {
          if (!result[date].hasOwnProperty(region)) {
            continue;
          }
          for (let distance in result[date][region]) {
            if (!result[date][region].hasOwnProperty(distance)) {
              continue;
            }
            trees.push(make_tree(date, region, distance,
                                 result[date][region][distance]));
          }
        }
      }
      return trees;
    });
  }
});


function make_tree(date, region, distance, tree) {
  if (date !== "Combined") {
    date = parse_date(date);
  }
  return Ember.Object.create({
    date: date,
    region: region,
    distance: distance,
    tree: tree
  });
}
