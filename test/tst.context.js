/*
 * tst.context.js: tests that cause works with errors from different contexts.
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_vm = require('vm');

function isError(e) {
  return Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
}

var VError = mod_verror.VError;
var WError = mod_verror.WError;

var err = new Error();
var verr = new VError(err);
mod_assert.ok(isError(verr.cause()));

var context = mod_vm.createContext({
	'callback': function callback(err2) {
		mod_assert.ok(isError(err2));
		var verr2 = new VError(err);
		mod_assert.ok(isError(verr2.cause()));
	}
});
mod_vm.runInContext('callback(new Error())', context);
