import Store from 'flea-app/pods/store/model';

export default {
  name: 'inject-store',
  initialize: function(app) {
    app.register('store:main', Store);
    app.inject('route', 'store', 'store:main');
    app.inject('controller', 'store', 'store:main');
  }
};
