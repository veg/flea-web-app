/* eslint-env node */
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {

    outputPaths: {
        app: {
            css: {
                  app: "/assets/flea-app.css",
            },
            js: "/assets/flea-app.js",
        },

        vendor: {
            css: "/assets/vendor.css",
            js: "/assets/vendor.js",
        },
    },

    'ember-font-awesome': {
      fontsOutput: "/assets/fonts",

      // The remove unused icons feature is not working for production
      // builds. Revisit this when ember-font-awesome gets updated.
      removeUnusedIcons: false
    },

    'ember-power-select': {
      theme: 'bootstrap'
    }

  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('bower_components/bootstrap/dist/css/bootstrap.css');
  app.import('bower_components/bootstrap/dist/css/bootstrap.css.map', {
    destDir: 'assets'
  });
  app.import('bower_components/bootstrap/dist/js/bootstrap.js');
  
  app.import('bower_components/d3/d3.js');
  
  app.import('bower_components/lodash/lodash.js');
  
  app.import('bower_components/moment/moment.js');
  
  app.import('bower_components/phylotree/phylotree.js');
  app.import('bower_components/phylotree/phylotree.css');
  
  app.import('bower_components/bio-pv/bio-pv.min.js');
  
  return app.toTree();
};
