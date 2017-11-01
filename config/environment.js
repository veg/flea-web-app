/* eslint-env node */
'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'flea-app',
    podModulePrefix: 'flea-app/pods',
    environment: environment,
    rootURL: '/',
    resultsURL: '/results/',
    apiURL: '/api/',
    locationType: 'auto',
    enableOtherRoutes: true,
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    'ember-prop-types': {
      // When true components will throw an error if they are missing propTypes. (Default is false)
      requireComponentPropTypes: true,

      // Validate properties coming from a spread property (default is undefined)
      spreadProperty: 'options',

      // Throw errors instead of logging warnings (default is false)
      // throwErrors: true,

      // Validate properties (default is true for all environments except "production")
      // validate: true,

      // Validate properties when they are updated (default is false)
      validateOnUpdate: true
    }

  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }
  if (environment === 'demo') {
    ENV.locationType = 'auto';
  }

  if (environment === 'production') {
    ENV.locationType = 'history';
  }

  return ENV;
};
