import { test } from 'qunit';
import moduleForAcceptance from 'flea-web-app/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | visit tabs');

test('visiting all tabs', function(assert) {
  visit('/results/P018/mds');
  find('#mds-input');
  andThen(() => assert.equal(currentURL(), '/results/P018/mds'));

  visit('/results/P018/trajectory');
  andThen(() => assert.equal(currentURL(), '/results/P018/trajectory'));

  visit('/results/P018/protein');
  andThen(() => assert.equal(currentURL(), '/results/P018/protein'));

  visit('/results/P018/sequences');
  andThen(() => assert.equal(currentURL(), '/results/P018/sequences'));

  visit('/results/P018/trees');
  andThen(() => assert.equal(currentURL(), '/results/P018/trees'));

});
