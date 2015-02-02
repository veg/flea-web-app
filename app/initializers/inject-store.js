import Store from 'flea-app/models/store';

export default {
  name: 'inject-store',
  initialize: function(container, app) {
    app.register('store:main', Store);
    app.inject('route', 'store', 'store:main');
    app.inject('controller', 'store', 'store:main');
  }
};
