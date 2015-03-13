import Ember from 'ember';
import config from '../config/environment';
import request from 'ic-ajax';
import {parse_date} from '../utils/utils';

export default Ember.Object.extend({

  find: function(session_id) {
    var url = config.baseURL + 'api/' + session_id + '/trees';
    return request(url).then(function(result) {
      var trees = [];
      for (var date in result) {
        if (!result.hasOwnProperty(date)) {
          continue;
        }
        for (var region in result[date]) {
          if (!result[date].hasOwnProperty(region)) {
            continue;
          }
          for (var distance in result[date][region]) {
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
