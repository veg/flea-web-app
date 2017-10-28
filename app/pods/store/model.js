import Ember from 'ember';
const {getOwner} = Ember;

let cache = {};

export default Ember.Object.extend({
  find(name, session_id) {
    let key = session_id + name;
    if (cache[key]) {
      return cache[key];
    }

    const owner = getOwner(this);
    const adapter = owner.lookup('adapter:' + name);
    return adapter.find(session_id).then(function(record) {
      cache[key] = record;
      return record;
    });
  }
});
