import Ember from 'ember';

var cache = {};

export default Ember.Object.extend({
  find: function(name) {
    if (cache[name]) {
      return cache[name];
    }

    var adapter = this.container.lookup('adapter:' + name);

    return adapter.find().then(function(record) {
      cache[name] = record;
      return record;
    });
  }
});
