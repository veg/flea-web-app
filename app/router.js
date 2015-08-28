import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType,
  baseURL: config.baseURL,
  rootURL: '/',
});

Router.map(function() {
  this.route("session", { path: "/:session_id" }, function() {
    this.route('trajectory', {path: '/trajectory'});
    this.route('gene', {path: '/gene'});
    this.route('sequences', {path: '/sequences'});
    this.route('trees', {path: '/trees'});
    // this.route('neutralization', {path: '/neutralization'});
  });
});

export default Router;
