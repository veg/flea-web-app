import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(sequence, ranges) {
  var escaped = sequence.split('').map(Handlebars.Utils.escapeExpression);
  var range_idx = 0;
  var result = escaped.map(function(aa, idx) {
    var html_str = '';
    if (range_idx < ranges.length) {
      if (idx === ranges[range_idx][0]) {
        html_str += "<span class = 'pngs'>";
      }
    }
    if (aa === "." || aa === "-") {
      html_str += aa;
    } else {
      aa = aa.toUpperCase();
      html_str += '<span class="aa' + aa + '">' + aa + '</span>';
    }
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
