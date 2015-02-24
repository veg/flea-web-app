import Ember from 'ember';
import {format_date, htmlTable} from '../utils/utils';

var float2 = d3.format (".2f");

// TODO: make sub route for individual cell popover

function format_percent(frac) {
  return float2(100 * frac) + "%";
}

export default Ember.Controller.extend({
  mabNames: function() {
    var json = this.get('model.neutralization');
    var result = [];
    for (var mab_name in json) {
      if (json.hasOwnProperty(mab_name)) {
        result.push(mab_name);
      }
    }
    result.sort();
    return result;
  }.property('self.model.neutralization.@each'),

  mabFeatures: function() {
    var json = this.get('model.neutralization');
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
  }.property('mabName.@each', 'model.neutralization.@each', 'seqIdToDate'),

  sortedDates: function() {
    var d = this.get('model.dates'];
    var result = [];
    for (var k in d) {
      if(d.hasOwnProperty(k)) {
        result.push(new Date(k));
      }
    }
    result.sort(function(a, b) {return a < b ? -1 : 1;});
    return result;
  }.property('model.date.@each'),

  // TODO: move these to the view?
  headerNames: function() {
    var dates = this.get('sortedDates');
    var result = dates.map(function(d) {return format_date(d);});
    result.splice(0, 0, 'mab');
    return result;
  }.property('sortedDate.@each'),

  tableData: function() {
    /* [[{value: v,
          color: c,
          html: h}]]
    */
    var red_white = d3.interpolateRgb("white", "red");
    var data = this.get('mabFeatures');
    var dates = this.get('sortedDates');
    var result = [];
    for (var mname in data) {
      if (!(data.hasOwnProperty(mname))) {
        continue;
      }
      var row = [];
      row.push({value: mname,
                style: "",
                html: ""});
      for (var i=0; i<dates.length; i++) {
        var date = dates[i];
        if (!(data[mname].hasOwnProperty(date))) {
          continue;
        }
        var feats = data[mname][date]['features'];
        var frac = 0;
        var resistant = [];
        var susceptible = [];
        if (feats.length > 0) {
          resistant = feats.filter(function(d) { return d.value; });
          susceptible = feats.filter(function(d) { return !d.value; });
          frac = resistant.length / (resistant.length + susceptible.length);
        }
        var reduced = feats.reduce(function(acc, f) {
          if (!(f.name in acc)) {
            acc[f.name] = [0, 0];
          }
          if (f.value) {
            acc[f.name][1] += 1;
          } else {
            acc[f.name][0] += 1;
          }
          return acc;
        }, {});
        var header = ['feature', 'susceptible', 'resistant'];
        var body = [];
        for (var name in reduced) {
          if (reduced.hasOwnProperty(name)) {
            body.push([name, reduced[name][0], reduced[name][1]]);
          }
        }
        var color = red_white(frac);
        row.push({value: format_percent(frac),
                  style: "background-color: " + color,
                  html: htmlTable(body, header)});
      }
      result.push(row);
    }
    return result;
  }.property('mabFeature.@each', 'sortedDate.@each'),

  seqIdToDate: function() {
    var seqs = this.get('model.sequences');
    return seqs.reduce(function(acc, s) {
      acc[s['id']] = s['date'];
      return acc;
    }, {});
  }.property('model.sequence.@each')
});


function ensureHas(obj, key, val) {
  if (! (key in obj)) {
    obj[key] = val;
  }
  return obj[key];
}
