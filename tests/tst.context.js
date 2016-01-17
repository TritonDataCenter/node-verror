/*
 * tst.context.js: tests that cause works with errors from different contexts.
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_isError = require('core-util-is').isError;
var mod_vm = require('vm');

var VError = mod_verror.VError;
var WError = mod_verror.WError;

var err = new Error();
var verr = new VError(err);
mod_assert.ok(mod_isError(verr.cause()));

var context = mod_vm.createContext({
  callback: function callback(err) {
    mod_assert.ok(mod_isError(err));
    var verr = new VError(err);
    mod_assert.ok(mod_isError(verr.cause()));
  },
});
mod_vm.runInContext('callback(new Error())', context);
