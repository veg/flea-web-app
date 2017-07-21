import Ember from 'ember';


export default Ember.Component.extend({
  tagName: 'a',
  attributeBindings: ['tabindex', 'dataToggle:data-toggle', 'dataTrigger:data-trigger',
                      'title', 'dataContent:data-content', 'placement'],
  classNames: ['popover-link'],
  tabindex: "0",
  dataToggle: "popover",
  dataTrigger: "focus",

  // public
  title: "Title",
  dataContent: "Content",
  html: true,
  placement: 'auto right',
  container: null,

  didInsertElement: function () {
    this.$().popover({
      html: this.get('html'),
      placement: this.get('placement'),
      container: this.get('container')
    });
  }.observes('dataContent', 'html', 'placement', 'container')
});
