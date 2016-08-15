/*
 * tst.common.js: tests functionality that's common to the VError, SError, and
 * WError classes.
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

/*
 * Runs all tests using the class "cons".  We'll apply this to each of the main
 * classes.
 */
function runTests(cons, label)
{
	var err, stack, stackname;

	console.error('running common tests for: %s', cons.name);

	/*
	 * On Node v0.10 and earlier, the name that's used in the "stack" output
	 * is the constructor that was used for this object.  On Node v0.12 and
	 * later, it's the value of the "name" property on the Error when it was
	 * constructed.
	 */
	if (mod_testcommon.oldNode()) {
		stackname = cons.name;
	} else {
		stackname = label;
	}

	/* no arguments */
	err = new cons();
	mod_assert.equal(err.name, label);
	mod_assert.ok(err instanceof Error);
	mod_assert.ok(err instanceof cons);
	mod_assert.equal(err.message, '');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname,
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* used without "new" */
	err = cons('test %s', 'foo');
	mod_assert.equal(err.name, label);
	mod_assert.ok(err instanceof Error);
	mod_assert.ok(err instanceof cons);
	mod_assert.equal(err.message, 'test foo');

	/* options-argument form */
	err = new cons({});
	mod_assert.equal(err.name, label);
	mod_assert.equal(err.message, '');
	mod_assert.ok(err.cause() === undefined);

	/* simple message */
	err = new cons('my error');
	mod_assert.equal(err.name, label);
	mod_assert.equal(err.message, 'my error');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname + ': my error',
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new cons({}, 'my error');
	mod_assert.equal(err.name, label);
	mod_assert.equal(err.message, 'my error');
	mod_assert.ok(err.cause() === undefined);

	/* fullStack */
	err = new cons('Some error');
	stack = mod_testcommon.cleanStack(VError.fullStack(err));
	mod_assert.equal(stack, [
		stackname + ': Some error',
		'    at runTests (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new Error('Some error');
	stack = mod_testcommon.cleanStack(VError.fullStack(err));
	mod_assert.equal(stack, [
		'Error: Some error',
		'    at runTests (dummy filename)',
		'    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* printf-style message */
	err = new cons('%s error: %3d problems', 'very bad', 15);
	mod_assert.equal(err.message, 'very bad error:  15 problems');
	mod_assert.ok(err.cause() === undefined);

	err = new cons({}, '%s error: %3d problems', 'very bad', 15);
	mod_assert.equal(err.message, 'very bad error:  15 problems');
	mod_assert.ok(err.cause() === undefined);

	/* null cause (for backwards compatibility with older versions) */
	err = new cons(null, 'my error');
	mod_assert.equal(err.message, 'my error');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname + ': my error',
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = new cons({ 'cause': null }, 'my error');
	mod_assert.equal(err.message, 'my error');
	mod_assert.ok(err.cause() === undefined);

	err = new cons(null);
	mod_assert.equal(err.message, '');
	mod_assert.ok(err.cause() === undefined);
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname,
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* constructorOpt */
	function makeErr(options) {
		return (new cons(options, 'test error'));
	}
	err = makeErr({});
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname + ': test error',
	    '    at makeErr (dummy filename)',
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	err = makeErr({ 'constructorOpt': makeErr });
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    stackname + ': test error',
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);

	/* invoked without "new" */
	err = cons('my %s string', 'testing!');
	mod_assert.equal(err.name, label);
	mod_assert.ok(err instanceof cons);
	mod_assert.ok(err instanceof Error);
	mod_assert.equal(err.message, 'my testing! string');

	/* custom "name" */
	err = new cons({ 'name': 'SomeOtherError' }, 'another kind of error');
	mod_assert.equal(err.name, 'SomeOtherError');
	mod_assert.ok(err instanceof cons);
	mod_assert.ok(err instanceof Error);
	mod_assert.equal(err.message, 'another kind of error');
	stack = mod_testcommon.cleanStack(err.stack);
	mod_assert.equal(stack, [
	    'SomeOtherError: another kind of error',
	    '    at runTests (dummy filename)',
	    '    at Object.<anonymous> (dummy filename)'
	].join('\n') + '\n' + nodestack);
}

runTests(VError, 'VError');
runTests(WError, 'WError');
runTests(SError, 'VError');
