import Ember from 'ember';

export default Ember.Controller.extend({
  mabFeatures: function() {
    var json = this.get('model')['neutralization'];
    var seq_id_to_date = this.get('seqIdToDate');

    var mab_table = {};
    for (var mab_name in json) {
      if (!json.hasOwnProperty(mab_name)) {
        continue;
      }
      var predictions = json[mab_name]['predictions'];
      var table_entry = ensureHas(mab_table, mab_name, {});
      for (var i=0; i<predictions.length; i++) {
        var seq = predictions[i];
        if (!(seq.id in seq_id_to_date)) {
          // FIXME: what to do with internal nodes?
          continue;
        }
        var date = seq_id_to_date[seq['id']];
        var value = +seq['value'];
        var elt = ensureHas(table_entry, date, {});
        var new_feats = ensureHas(elt, 'features', []);
        var features = seq.features;
        for (var j=0; j<features.length; j++) {
          new_feats.push({name: features[j],
                          value: value > 0});
        }
      }
    }
    return mab_table;
  }.property('model.neutralization@each', 'seqIdToDate'),

  // TODO: move these to the view?
  headerNames: function() {
    var d = this.get('model')['dates'];
    var result = [];
    for (var k in d) {
      if(d.hasOwnProperty(k)) {
        result.push(k);
      }
    }
    result.sort();
    result.splice(0, 0, 'mab');
    return result;
  }.property('model.dates@each'),

  tableData: function() {
    /* [[{value: v,
          color: c,
          html: h}]]
    */
    var red_white = d3.interpolateRgb("white", "red");
    var data = this.get('mabFeatures');
    console.log(data);
    var result = [];
    for (var mname in data) {
      if (!(data.hasOwnProperty(mname))) {
        continue;
      }
      var row = [];
      row.push({value: mname,
                style: "",
                html: ""});
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
    console.log(result);
    return result;
  }.property('mabFeatures@each'),

  seqIdToDate: function() {
    var result = [];
    var seqs = this.get('model')['sequences'];
    return seqs.reduce(function(acc, s) {
      acc[s['id']] = s['date'];
      return acc;
    }, {});
  }.property('model.sequences@each')
});


function ensureHas(obj, key, val) {
  if (! (key in obj)) {
    obj[key] = val;
  }
  return obj[key];
}
