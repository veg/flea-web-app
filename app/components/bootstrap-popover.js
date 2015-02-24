import Ember from 'ember';


export default Ember.Component.extend({
  tagName: 'a',
  attributeBindings: ['tabindex', 'html', 'dataToggle:data-toggle', 'dataTrigger:data-trigger', 'title', 'dataContent:data-content'],
  classNames: ['bootstrap-popover'],
  tabindex: "0",
  dataToggle: "popover",
  dataTrigger: "focus",

  // public
  title: "Title",
  dataContent: "Content",
  html: true,

  didInsertElement: function () {
    this.$().popover();
  }.observes('groupedSequences')
})
