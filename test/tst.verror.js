/*
 * tst.verror.js: tests functionality that's specific to the VError and SError
 * classes.
 */

var mod_assert = require('assert');
var mod_verror = require('../lib/verror');
var mod_testcommon = require('./common');

var SError = mod_verror.SError;
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
	var err, suberr, stack, stackname;

	console.error('running VError/SError tests');

	/* "null" or "undefined" as string for extsprintf */
	err = new VError('my %s string', null);
	mod_assert.equal('my null string', err.message);
	err = new VError('my %s string', undefined);
	mod_assert.equal('my undefined string', err.message);

	mod_assert.throws(function () {
		console.error(
		    new VError({ 'strict': true }, 'my %s string', null));
	}, /attempted to print undefined or null as a string/);
	mod_assert.throws(function () {
		console.error(new SError('my %s string', undefined));
	}, /attempted to print undefined or null as a string/);

	mod_assert.throws(function () {
		console.error(new SError('my %s string', null));
	}, /attempted to print undefined or null as a string/);
	mod_assert.throws(function () {
		console.error(new SError('my %s string', undefined));
	}, /attempted to print undefined or null as a string/);

	/* caused by another error, with no additional message */
	suberr = new Error('root cause');
	err = new VError(suberr);
	mod_assert.equal(err.message, ': root cause');
	mod_assert.ok(err.cause() === suberr);

	err = new VError({ 'cause': suberr });
	mod_assert.equal(err.message, ': root cause');
	mod_assert.ok(err.cause() === suberr);

	/* caused by another error, with annotation */
	err = new VError(suberr, 'proximate cause: %d issues', 3);
	mod_assert.equal(err.message, 'proximate cause: 3 issues: root cause');
	mod_assert.ok(err.cause() === suberr);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    'VError: proximate cause: 3 issues: root cause',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new SError({ 'cause': suberr }, 'proximate cause: %d issues', 3);
	mod_assert.equal(err.message, 'proximate cause: 3 issues: root cause');
	mod_assert.ok(err.cause() === suberr);
	stack = mod_testcommon.cleanStack(err.stack);
	/* See the comment in tst.common.js. */
	stackname = mod_testcommon.oldNode() ? 'SError': 'VError';
	mod_assert.equal(stack, [
	    stackname + ': proximate cause: 3 issues: root cause',
	    '    at main (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* caused by another VError, with annotation. */
	suberr = err;
	err = new VError(suberr, 'top');
	mod_assert.equal(err.message,
	    'top: proximate cause: 3 issues: root cause');
	mod_assert.ok(err.cause() === suberr);

	err = new VError({ 'cause': suberr }, 'top');
	mod_assert.equal(err.message,
	    'top: proximate cause: 3 issues: root cause');
	mod_assert.ok(err.cause() === suberr);

	/* caused by a WError */
	suberr = new WError(new Error('root cause'), 'mid');
	err = new VError(suberr, 'top');
	mod_assert.equal(err.message, 'top: mid');
	mod_assert.ok(err.cause() === suberr);

	/* fullStack */
	suberr = new VError(new Error('root cause'), 'mid');
	err = new VError(suberr, 'top');
	stack = mod_testcommon.cleanStack(VError.fullStack(err));
	mod_assert.equal(stack, [
		'VError: top: mid: root cause',
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack + '\n' + [
		'caused by: VError: mid: root cause',
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack + '\n' + [
		'caused by: Error: root cause',
		'    at main (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);
}

main();
