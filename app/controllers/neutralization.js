import Ember from 'ember';

export default Ember.Controller.extend({
  mabFeatures: function() {
    var json = this.get('model');
    var seq_id_to_date = this.get('seqIdToDate');

    var mab_table = {};
    for (var mab_name in json) {
      if (!json.hasOwnProperty(mab_name)) {
        continue;
      }
      for (var seq in json[mab_name]['predictions']) {
        var date = seq_id_to_date[seq['id']];
        var value = +seq['value'];
        var elt = ensureHas(mab_table, date, {});
        var new_feats = ensureHas(elt, 'features', []);
        for (var f in seq['features']) {
          new_feats.push({name: f,
                          value: value > 0});
        }
      }
    }
    return mab_table;
  }.property('model@each', 'seqIdToDate'),

  // TODO: move these to the view?
  headerNames: function() {
    var dates = this.get('dates');
    // FIXME: why do we get a promise here???
    dates.then(function(d) {
      console.log(d);
      var result = [];
      for (var k in d) {
        if(d.hasOwnProperty(k)) {
          result.push();
        }
      }
      result.sort();
      result.splice(0, 'mab');
      return result;
    });
  }.property('dates@each'),

  tableData: function() {
    /* [[{value: v,
          color: c,
          html: h}]]
    */
    var red_white = d3.interpolateRgb("white", "red");
    var data = this.get('mabFeatures');
    var result = [];
    for (var mname in data) {
      if (!(data.hasOwnProperty(mname))) {
        continue;
      }
      var row = [];
      for (var date in data[mname]) {
        if (!(data[mname].hasOwnProperty(date))) {
          continue;
        }
        var percent = "100%";
        row.push({value: percent,
                  style: "background-color: rgb(255, 0, 0);",
                  html: "TODO"});
      }
      result.push(row);
    }
    return result;
  }.property('mabFeatures@each'),

  seqIdToDate: function() {
    var result = [];
    var promise = this.get('sequences');
    promise.then(function(seqs) {
      return seqs.reduce(function(acc, s) {
        acc[s['id']] = s['date'];
        return acc;
      }, {});
    });
  }.property('sequences@each')

});


function ensureHas(obj, key, val) {
  if (! (key in obj)) {
    obj[key] = val;
  }
  return obj[key];
}
