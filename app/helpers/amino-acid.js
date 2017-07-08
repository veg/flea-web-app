import Ember from 'ember';

export default Ember.Helper.helper(function(params, hash) {
  if (params.length !==1) {
    throw('helper called without sequence');
  }
  var sequence = params[0];
  var ranges = [];
  if (hash.hasOwnProperty('ranges')) {
    ranges = hash['ranges'];
  }
  var mask = false;
  if (hash.hasOwnProperty('mask')) {
    mask = hash['mask'];
  }
  var escaped = sequence.split('').map(Ember.Handlebars.Utils.escapeExpression);
  var range_idx = 0;
  var result = escaped.map(function(aa, idx) {
    var html_str = '';
    if (range_idx < ranges.length) {
      if (idx >= ranges[range_idx][0] && idx <= ranges[range_idx][1]) {
        html_str += "<span class = 'pngs'>"; // class pngs makes span background grey.
      }
    }
    aa = aa.toUpperCase();
    var _class = "";
    if (aa === "|") {
      _class = '"seperator"';
    } else {
      _class = 'aa aa' + aa;
      if (mask && mask[idx]) {
        _class += ' match';
        if (aa !== "-") {
          aa = ".";
        }
      }
      _class = '"' + _class + '"';
    }
    html_str += '<span class=' + _class + '>' + aa + '</span>';
    if (range_idx < ranges.length) {
      if (idx >= ranges[range_idx][0] && idx <= ranges[range_idx][1]) {
        html_str += "</span>";
        if(idx === ranges[range_idx][1]){
          range_idx++;
        }
      }
    }
    return html_str;
  });
  var fin = "<td class = 'seq-cell sequence'>"+result.join("</td><td class = 'seq-cell sequence'>")+"</td>";
  return new Ember.Handlebars.SafeString(fin);
});