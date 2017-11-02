import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route("session", { path: "/results/:session_id" }, function() {
    if (config['fleaMode']) {
      this.route('mds', {path: '/mds'});
      this.route('trajectory', {path: '/trajectory'});
      this.route('trees', {path: '/trees'});
    }
    this.route('protein', {path: '/protein'});
    this.route('sequences', {path: '/sequences'});
  });
});

export default Router;
