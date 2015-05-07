import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(sequence, ranges, mask) {
  var escaped = sequence.split('').map(Ember.Handlebars.Utils.escapeExpression);
  var range_idx = 0;
  var result = escaped.map(function(aa, idx) {
    var html_str = '';
    if (range_idx < ranges.length) {
      if (idx === ranges[range_idx][0]) {
        html_str += "<span class = 'pngs'>";
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
      if (idx === ranges[range_idx][1]) {
        html_str += "</span>";
        range_idx++;
      }
    }
    return html_str;
  });
  return new Ember.Handlebars.SafeString(result.join(''));
});
