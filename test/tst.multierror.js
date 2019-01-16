/*
 * tst.multierror.js: tests MultiError class
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_testcommon = require('./common');

var MultiError = mod_verror.MultiError;
var errorFromList = mod_verror.errorFromList;
var errorForEach = mod_verror.errorForEach;

/*
 * Save the generic parts of all stack traces so we can avoid hardcoding
 * Node-specific implementation details in our testing of stack traces.
 * The stack trace limit has to be large enough to capture all of Node's frames,
 * which are more than the default (10 frames) in Node v6.x.
 */
Error.stackTraceLimit = 20;
var nodestack = new Error().stack.split('\n').slice(2).join('\n');

function main()
{
	var err1, err2, err3, merr, stack;
	var accum, doAccum;

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


	/* errorFromList */
	mod_assert.throws(function () {
		console.error(errorFromList());
	}, /^AssertionError.*: errors \(\[object\]\) is required$/);

	mod_assert.throws(function () {
		console.error(errorFromList(null));
	}, /^AssertionError.*: errors \(\[object\]\) is required$/);

	mod_assert.throws(function () {
		console.error(errorFromList({}));
	}, /^AssertionError.*: errors \(\[object\]\) is required$/);

	mod_assert.throws(function () {
		console.error(errorFromList('asdf'));
	}, /^AssertionError.*: errors \(\[object\]\) is required$/);

	mod_assert.throws(function () {
		console.error(errorFromList([ new Error(), 17 ]));
	}, /^AssertionError.*: errors \(\[object\]\) is required$/);

	mod_assert.throws(function () {
		console.error(errorFromList([ new Error(), {} ]));
	}, /^AssertionError/);

	mod_assert.strictEqual(null, errorFromList([]));
	mod_assert.ok(err1 == errorFromList([ err1 ]));
	mod_assert.ok(err2 == errorFromList([ err2 ]));
	merr = errorFromList([ err1, err2, err3 ]);
	mod_assert.ok(merr instanceof MultiError);
	mod_assert.ok(merr.errors()[0] == err1);
	mod_assert.ok(merr.errors()[1] == err2);
	mod_assert.ok(merr.errors()[2] == err3);


	/* errorForEach */
	mod_assert.throws(function () {
		console.error(errorForEach());
	}, /^AssertionError.*: err must be an Error$/);

	mod_assert.throws(function () {
		console.error(errorForEach(null));
	}, /^AssertionError.*: err must be an Error$/);

	mod_assert.throws(function () {
		console.error(errorForEach(err1));
	}, /^AssertionError.*: func \(func\) is required$/);

	mod_assert.throws(function () {
		console.error(errorForEach(err1, {}));
	}, /^AssertionError.*: func \(func\) is required$/);

	mod_assert.throws(function () {
		console.error(errorForEach({}, function () {}));
	}, /^AssertionError.*: err must be an Error$/);

	accum = [];
	doAccum = function (e) { accum.push(e); };

	accum = [];
	errorForEach(err1, doAccum);
	mod_assert.equal(accum.length, 1);
	mod_assert.ok(accum[0] == err1);

	accum = [];
	errorForEach(merr, doAccum);
	mod_assert.equal(accum.length, 3);
	mod_assert.ok(accum[0] == err1);
	mod_assert.ok(accum[1] == err2);
	mod_assert.ok(accum[2] == err3);
}

main();
