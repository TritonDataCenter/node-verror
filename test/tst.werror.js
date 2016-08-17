/*
 * tst.werror.js: tests basic functionality specific to the WError class.
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_testcommon = require('./common');

var VError = mod_verror.VError;
var WError = mod_verror.WError;

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
	var err, suberr, stack, stackmessageTop, stackmessageMid;

	/*
	 * Most of the test cases here have analogs in tst.common.js.  In this
	 * test, we check for WError-specific behavior (e.g., toString()).
	 */
	console.error('running WError-specific tests');

	/* no arguments */
	err = new WError();
	mod_assert.equal(err.toString(), 'WError');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    'WError',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* options-argument form */
	err = new WError({});
	mod_assert.equal(err.toString(), 'WError');
	mod_assert.ok(err.cause() === undefined);

	/* simple message */
	err = new WError('my error');
	mod_assert.equal(err.message, 'my error');
	mod_assert.equal(err.toString(), 'WError: my error');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    'WError: my error',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new WError({}, 'my error');
	mod_assert.equal(err.toString(), 'WError: my error');
	mod_assert.ok(err.cause() === undefined);

	/* caused by another error, with no additional message */
	suberr = new Error('root cause');
	err = new WError(suberr);
	mod_assert.equal(err.message, '');
	mod_assert.equal(err.toString(), 'WError; caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);

	err = new WError({ 'cause': suberr });
	mod_assert.equal(err.message, '');
	mod_assert.equal(err.toString(), 'WError; caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);

	/* caused by another error, with annotation */
	err = new WError(suberr, 'proximate cause: %d issues', 3);
	mod_assert.equal(err.message, 'proximate cause: 3 issues');
	mod_assert.equal(err.toString(), 'WError: proximate cause: 3 issues; ' +
	    'caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);
	stack = mod_testcommon.cleanStack(err.stack);
	/* See the comment in tst.inherit.js. */
	stackmessageTop = mod_testcommon.oldNode() ?
	    'WError: proximate cause: 3 issues; caused by Error: root cause' :
	    'WError: proximate cause: 3 issues';
	mod_assert.equal(stack, [
	    stackmessageTop,
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new WError({ 'cause': suberr }, 'proximate cause: %d issues', 3);
	mod_assert.equal(err.message, 'proximate cause: 3 issues');
	mod_assert.equal(err.toString(), 'WError: proximate cause: 3 issues; ' +
	    'caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackmessageTop,
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* caused by another WError, with annotation. */
	suberr = err;
	err = new WError(suberr, 'top');
	mod_assert.equal(err.message, 'top');
	mod_assert.equal(err.toString(), 'WError: top; caused by WError: ' +
	    'proximate cause: 3 issues; caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);

	err = new WError({ 'cause': suberr }, 'top');
	mod_assert.equal(err.message, 'top');
	mod_assert.equal(err.toString(), 'WError: top; caused by WError: ' +
	    'proximate cause: 3 issues; caused by Error: root cause');
	mod_assert.ok(err.cause() === suberr);

	/* caused by a VError */
	suberr = new VError(new Error('root cause'), 'mid');
	err = new WError(suberr, 'top');
	mod_assert.equal(err.message, 'top');
	mod_assert.equal(err.toString(),
	    'WError: top; caused by VError: mid: root cause');
	mod_assert.ok(err.cause() === suberr);

	/* fullStack */
	suberr = new WError(new Error('root cause'), 'mid');
	err = new WError(suberr, 'top');
	stack = mod_testcommon.cleanStack(VError.fullStack(err));
	/* See the comment in tst.inherit.js. */
	stackmessageMid = mod_testcommon.oldNode() ?
	    'WError: mid; caused by Error: root cause' :
	    'WError: mid';
	stackmessageTop = mod_testcommon.oldNode() ?
	    'WError: top; caused by ' + stackmessageMid :
	    'WError: top';
	mod_assert.equal(stack, [
		stackmessageTop,
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack + '\n' + [
		'caused by: ' + stackmessageMid,
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack + '\n' + [
		'caused by: Error: root cause',
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);
}

main();
