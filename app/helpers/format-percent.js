import Ember from 'ember';

let percentage = d3.format('>5.2f');

export default Ember.Helper.helper(function(params) {
  let value = params[0];
  let escaped = Ember.Handlebars.Utils.escapeExpression(value);
  return new Ember.String.htmlSafe(percentage(escaped));
});
