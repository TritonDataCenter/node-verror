/*
 * tst.multierror.js: tests MultiError class
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_testcommon = require('./common');

var MultiError = mod_verror.MultiError;

/*
 * Save the generic parts of all stack traces so we can avoid hardcoding
 * Node-specific implementation details in our testing of stack traces.
 */
var nodestack = new Error().stack.split('\n').slice(2).join('\n');

function main()
{
	var err1, err2, err3, merr, stack;

	mod_assert.throws(function () {
		console.error(new MultiError());
	}, /list of errors \(array\) is required/);

	mod_assert.throws(function () {
		console.error(new MultiError([]));
	}, /must be at least one error/);

	err1 = new Error('error one');
	err2 = new Error('error two');
	err3 = new Error('error three');
	merr = new MultiError([ err1, err2, err3 ]);
	mod_assert.equal(err1, merr.cause());
	mod_assert.equal(merr.message, 'first of 3 errors: error one');
	mod_assert.equal(merr.name, 'MultiError');
	stack = mod_testcommon.cleanStack(merr.stack);
	mod_assert.equal(stack, [
	    'MultiError: first of 3 errors: error one',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	merr = new MultiError([ err1 ]);
	mod_assert.equal(merr.message, 'first of 1 error: error one');
	mod_assert.equal(merr.name, 'MultiError');
	stack = mod_testcommon.cleanStack(merr.stack);
	mod_assert.equal(stack, [
	    'MultiError: first of 1 error: error one',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);
}

main();
