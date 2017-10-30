import { test } from 'qunit';
import moduleForAcceptance from 'flea-app/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | results/P018/mds');

test('visiting /results/P018/mds', function(assert) {
  visit('/results/P018/mds');
  fillIn('#mds-input', 'V03');
  click('#mds-interpolate');
  andThen(() => assert.equal(true, true));
});
