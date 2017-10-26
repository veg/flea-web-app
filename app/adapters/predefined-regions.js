import Ember from 'ember';

export default Ember.Object.extend({
  ajax: Ember.inject.service(),

  find: function() {
    var url = '/assets/predefined_regions.json';
    return this.get("ajax").request(url).then(function(data) {
      var regions = data['regions'];
      // convert from 1-indexed [start, stop] to  0-index [start, stop)
      for (let i=0; i<regions.length; i++) {
        regions[i].start -= 1;
      }
      return regions;
    });
  }
});
