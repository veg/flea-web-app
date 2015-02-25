export default {
  name: 'inject-session-id',
  initialize: function(container, app) {
    app.register('session-id:main', window.session_id, {instantiate: false});
    app.inject('store:main', 'session_id', 'session-id:main');
    app.inject('router:main', 'session_id', 'session-id:main');
  }
};
