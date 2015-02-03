import Ember from 'ember';

var float2 = d3.format (".2f");

function format_percent(frac) {
  return float2(100 * frac) + "%";
}

export default Ember.Controller.extend({
  mabNames: function() {
    var json = this.get('model')['neutralization'];
    var result = [];
    for (var mab_name in json) {
      if (json.hasOwnProperty(mab_name)) {
        result.push(mab_name);
      }
    }
    result.sort();
    return result;
  }.property('self.model.neutralization@each'),

  mabFeatures: function() {
    var json = this.get('model')['neutralization'];
    var seq_id_to_date = this.get('seqIdToDate');

    var mab_table = {};
    var names = this.get('mabNames');
    for (var i=0; i<names.length; i++) {
      var mab_name = names[i];
      if (!json.hasOwnProperty(mab_name)) {
        continue;
      }
      var predictions = json[mab_name]['predictions'];
      var table_entry = ensureHas(mab_table, mab_name, {});
      for (var j=0; j<predictions.length; j++) {
        var seq = predictions[j];
        if (!(seq.id in seq_id_to_date)) {
          // FIXME: what to do with internal nodes?
          continue;
        }
        var date = seq_id_to_date[seq['id']];
        var value = +seq['value'];
        var elt = ensureHas(table_entry, date, {});
        var new_feats = ensureHas(elt, 'features', []);
        var features = seq.features;
        for (var k=0; k<features.length; k++) {
          new_feats.push({name: features[k],
                          value: value > 0});
        }
      }
    }
    return mab_table;
  }.property('mabNames@each', 'model.neutralization@each', 'seqIdToDate'),

  sortedDates: function() {
    var d = this.get('model')['dates'];
    var result = [];
    for (var k in d) {
      if(d.hasOwnProperty(k)) {
        result.push(new Date(k));
      }
    }
    result.sort(function(a, b) {return a < b ? -1 : 1;});
    return result;
  }.property('model.dates@each'),

  // TODO: move these to the view?
  headerNames: function() {
    var dates = this.get('sortedDates');
    var result = dates.map(function(d) {return moment(d).format("MMM YYYY")});
    result.splice(0, 0, 'mab');
    return result;
  }.property('sortedDates@each'),

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
      row.push({value: mname,
                style: "",
                html: ""});
      for (var date in data[mname]) {
        if (!(data[mname].hasOwnProperty(date))) {
          continue;
        }
        var feats = data[mname][date]['features'];
        var frac = 0;
        if (feats.length > 0) {
          var resistant = feats.filter(function(d) { return d.value; });
          var susceptible = feats.filter(function(d) { return !d.value; });
          frac = resistant.length / (resistant.length + susceptible.length);
        }
        row.push({value: format_percent(frac),
                  style: "background-color: rgb(255, 0, 0);",
                  html: "TODO"});
      }
      result.push(row);
    }
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