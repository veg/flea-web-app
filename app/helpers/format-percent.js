import Ember from 'ember';

var percentage = d3.format('>5.2f');

export default Ember.Handlebars.makeBoundHelper(function(value) {
  var escaped = Handlebars.Utils.escapeExpression(value);
  return new Ember.Handlebars.SafeString(percentage(escaped));
});
