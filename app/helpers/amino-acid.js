import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(value) {
  var escaped = value.split('').map(Handlebars.Utils.escapeExpression);
  var result = escaped.map(function(aa) {
    if (aa === "." || aa === "-") {
      return aa;
    }
    aa = aa.toUpperCase();
    return '<span class="aa' + aa + '">' + aa + '</span>';
  });
  return new Ember.Handlebars.SafeString(result.join(''));
});
