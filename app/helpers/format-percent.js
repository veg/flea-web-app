import Ember from 'ember';

var percentage = d3.format('>5.2f');

export default Ember.Helper.helper(function(params) {
  var value = params[0];
  var escaped = Ember.Handlebars.Utils.escapeExpression(value);
  return new Ember.Handlebars.SafeString(percentage(escaped));
});
