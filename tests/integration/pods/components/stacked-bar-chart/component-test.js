import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('stacked-bar-chart', 'Integration | Component | stacked bar chart', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{stacked-bar-chart}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#stacked-bar-chart}}
      template block text
    {{/stacked-bar-chart}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
