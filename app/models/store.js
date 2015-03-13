import Ember from 'ember';

var cache = {};

export default Ember.Object.extend({
  find: function(name, session_id) {
    var key = session_id + name;
    if (cache[key]) {
      return cache[key];
    }

    var adapter = this.container.lookup('adapter:' + name);
    return adapter.find(session_id).then(function(record) {
      cache[key] = record;
      return record;
    });
  }
});
