module.exports = {
  globals: {
    server: true,
  },
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    'no-console': 'warn'
  },
  globals: {
    server: true,
    "@": false,
    "R": false,
    "d3": false,
    "pv": false,
    "moment": false,
    "d3_phylotree_is_leafnode": false,
    "d3_add_custom_menu": false
  }
};
