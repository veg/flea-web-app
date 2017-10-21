import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route("session", { path: "/results/:session_id" }, function() {
    this.route('trajectory', {path: '/trajectory'});
    this.route('mds', {path: '/mds'});
    this.route('protein', {path: '/protein'});
    this.route('sequences', {path: '/sequences'});
    this.route('trees', {path: '/trees'});
    // this.route('neutralization', {path: '/neutralization'});
  });
});

export default Router;
