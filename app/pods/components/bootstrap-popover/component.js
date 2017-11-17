import Ember from 'ember';

import { observes } from 'ember-decorators/object';
import { PropTypes } from 'ember-prop-types';


export default Ember.Component.extend({
  tagName: 'a',
  attributeBindings: ['tabindex', 'dataToggle:data-toggle', 'dataTrigger:data-trigger',
                      'title', 'dataContent:data-content', 'placement'],
  classNames: ['popover-link'],
  tabindex: "0",
  dataToggle: "popover",
  dataTrigger: "focus",

   propTypes: {
     title: PropTypes.string,
     dataContent: PropTypes.string,
     html: PropTypes.bool,
     placement: PropTypes.string,
   },

  getDefaultProps() {
    return {
      title: "Title",
      dataContent: "Content",
      html: true,
      placement: 'auto right',
    };
  },

  @observes('dataContent', 'html', 'placement')
  didInsertElement: function () {
    this._super(...arguments);
    this.$().popover({
      html: this.get('html'),
      placement: this.get('placement')
    });
  }
});
