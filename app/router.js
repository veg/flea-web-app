import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.resource('trajectory', {path: '/trajectory'});
  this.resource('gene', {path: '/gene'});
  this.resource('sequences', {path: '/sequences'});
  this.resource('trees', {path: '/trees'});
  this.resource('neutralization', {path: '/neutralization'});
});

export default Router;
