/*
 * tst.context.js: tests that cause works with errors from different contexts.
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_vm = require('vm');

var VError = mod_verror.VError;
var WError = mod_verror.WError;

var prog1 = 'callback(new Error(), "Error")';
var prog2 = 'var e = new Error(); e.name = "BarError"; callback(e, "BarError")';

function runTests(cerr, name) {
	var verr;

	/*
	 * The constructor should recognize the other context's Error as an
	 * error for wrapping, and not as an options object.
	 */
	verr = new VError(cerr);
	mod_assert.equal(verr.cause(), cerr);

	verr = new VError({ cause: cerr });
	mod_assert.equal(verr.cause(), cerr);

	/*
	 * The assertions done at each step while walking the cause chain
	 * should be okay with the other context's Error.
	 */
	mod_assert.deepEqual(
	    mod_verror.findCauseByName(cerr, 'FooError'), null);
	mod_assert.equal(
	    mod_verror.findCauseByName(verr, name), cerr);

	/*
	 * Verify that functions that take an Error as an argument
	 * accept the Error created in the other context.
	 */
	mod_assert.deepEqual(mod_verror.cause(cerr), null);
	mod_assert.deepEqual(mod_verror.info(cerr), {});
	mod_assert.equal(typeof (mod_verror.fullStack(cerr)), 'string');
}

var context = mod_vm.createContext({
	'callback': runTests
});

/*
 * We run the same set of tests using two different errors: one whose name is
 * the default "Error", and one whose name has been changed.
 *
 * Note that changing the name is not the same as having a constructor that
 * inherits from Error. Such Errors are not currently supported when
 * constructed in another context.
 */
mod_vm.runInContext(prog1, context);
mod_vm.runInContext(prog2, context);
