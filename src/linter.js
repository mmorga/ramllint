'use strict';

var parser = require('raml2obj'),

    Log = require('./log.js'),
    Rules = require('./rules.js'),
    typeOf = require('./typeOf.js');

function Linter(options) {
  var log = new Log(),
      rules = new Rules(log, options);

  this.lint = function lint(raml, cb) {
    log.empty();

    function resolve() {
      cb(log.read('error'));
    }

    return parser
      .parse(raml)
      .then(lintRoot.bind(this, rules), parseError)
      .finally(resolve);
  };

  function parseError() {
    log.error('RAML', '[parse_error] Parse error.', {id: 'parse_error'});
  }
}

function lintMethod(rules, method) {
  rules.run('method', method);

  Object.keys(method.responses)
    .forEach(function eachMethod(code) {
      lintResponse(rules, code, method.responses[code] || {});
    });
}

function lintResource(rules, resource) {
  rules.run('resource', resource);

  (resource.methods || [])
    .forEach(lintMethod.bind(this, rules));

  (resource.resources || [])
    .forEach(lintResource.bind(this, rules));
}

function lintResponse(rules, code, response) {
  response.code = code;
  rules.run('response', response);
}

function lintRoot(rules, root) {
  root.resource = 'root';
  rules.run('root', root);

  (root.resources || [])
    .forEach(lintResource.bind(this, rules));
}

/* istanbul ignore else */
if (typeOf(exports, 'object')) {
  module.exports = Linter;
}
