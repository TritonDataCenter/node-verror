/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2025 Edgecast Cloud LLC.
 */

/*
 * tst.inspect.js: tests for util.inspect / console.log compatibility
 *
 * Node.js 24+ changed how util.inspect handles the "cause" property on Error
 * objects (due to the ES2022 Error Cause standard). VError defines "cause" as
 * a prototype method rather than a data property, which caused Node 24's
 * inspector to crash with:
 *
 *     TypeError: Cannot read properties of undefined (reading 'value')
 *         at formatProperty (node:internal/util/inspect:2280:12)
 *
 * This test verifies that VError objects can be safely inspected on Node 24+.
 */

var mod_assert = require('assert');
var mod_util = require('util');
var mod_verror = require('../lib/verror');

var VError = mod_verror.VError;
var WError = mod_verror.WError;
var MultiError = mod_verror.MultiError;

/*
 * Check if we're running on Node.js 24 or greater.
 */
function getNodeMajorVersion()
{
	var match = process.versions.node.match(/^(\d+)\./);
	return (match ? parseInt(match[1], 10) : 0);
}

function main()
{
	var majorVersion = getNodeMajorVersion();

	if (majorVersion < 24) {
		console.error('skipping inspect tests (Node.js %s < 24)',
		    process.versions.node);
		return;
	}

	console.error('running inspect tests (Node.js %s)', process.versions.node);

	testVErrorInspect();
	testWErrorInspect();
	testMultiErrorInspect();
	testNestedVErrorInspect();
	testVErrorWithInfoInspect();
	testCauseMethodStillWorks();

	console.error('all inspect tests passed');
}

/*
 * Test that a basic VError with a cause can be inspected without crashing.
 * This is the exact scenario that crashed on Node 24 before the fix.
 */
function testVErrorInspect()
{
	var rootError = new Error('root cause');
	var err = new VError(rootError, 'wrapped error');

	/*
	 * This would crash on Node 24 before the fix with:
	 * TypeError: Cannot read properties of undefined (reading 'value')
	 */
	var result = mod_util.inspect(err);
	mod_assert.ok(typeof result === 'string',
	    'util.inspect should return a string');
	mod_assert.ok(result.indexOf('VError') !== -1,
	    'inspect output should contain "VError"');
	mod_assert.ok(result.indexOf('wrapped error') !== -1,
	    'inspect output should contain the error message');
	mod_assert.ok(result.indexOf('root cause') !== -1,
	    'inspect output should contain the cause message');

	console.error('  - VError inspect: ok');
}

/*
 * Test that WError can be inspected without crashing.
 */
function testWErrorInspect()
{
	var rootError = new Error('root cause');
	var err = new WError(rootError, 'wrapped error');

	var result = mod_util.inspect(err);
	mod_assert.ok(typeof result === 'string',
	    'util.inspect should return a string');
	mod_assert.ok(result.indexOf('WError') !== -1,
	    'inspect output should contain "WError"');

	console.error('  - WError inspect: ok');
}

/*
 * Test that MultiError can be inspected without crashing.
 */
function testMultiErrorInspect()
{
	var err1 = new VError('first error');
	var err2 = new VError('second error');
	var err = new MultiError([err1, err2]);

	var result = mod_util.inspect(err);
	mod_assert.ok(typeof result === 'string',
	    'util.inspect should return a string');
	mod_assert.ok(result.indexOf('MultiError') !== -1,
	    'inspect output should contain "MultiError"');

	console.error('  - MultiError inspect: ok');
}

/*
 * Test that deeply nested VErrors can be inspected without crashing.
 */
function testNestedVErrorInspect()
{
	var level1 = new Error('level 1');
	var level2 = new VError(level1, 'level 2');
	var level3 = new VError(level2, 'level 3');
	var level4 = new VError(level3, 'level 4');

	var result = mod_util.inspect(level4);
	mod_assert.ok(typeof result === 'string',
	    'util.inspect should return a string');

	console.error('  - nested VError inspect: ok');
}

/*
 * Test that VError with info properties can be inspected without crashing.
 */
function testVErrorWithInfoInspect()
{
	var err = new VError({
		cause: new Error('root cause'),
		info: {
			userId: 123,
			operation: 'save',
			timestamp: Date.now()
		}
	}, 'operation failed');

	var result = mod_util.inspect(err);
	mod_assert.ok(typeof result === 'string',
	    'util.inspect should return a string');
	mod_assert.ok(result.indexOf('jse_info') !== -1,
	    'inspect output should contain jse_info');
	mod_assert.ok(result.indexOf('userId') !== -1,
	    'inspect output should contain info properties');

	console.error('  - VError with info inspect: ok');
}

/*
 * Test that the cause() method still works correctly after the fix.
 * The fix should not break the existing API.
 */
function testCauseMethodStillWorks()
{
	var rootError = new Error('root cause');
	var err = new VError(rootError, 'wrapped error');

	/*
	 * The prototype cause() method should still work.
	 */
	mod_assert.ok(err.cause() === rootError,
	    'err.cause() should return the root error');

	/*
	 * The static VError.cause() method should still work.
	 */
	mod_assert.ok(VError.cause(err) === rootError,
	    'VError.cause(err) should return the root error');

	/*
	 * VError without a cause should return undefined from the method
	 * and null from the static function.
	 */
	var noCauseErr = new VError('no cause');
	mod_assert.ok(noCauseErr.cause() === undefined,
	    'err.cause() should return undefined when no cause');
	mod_assert.ok(VError.cause(noCauseErr) === null,
	    'VError.cause(err) should return null when no cause');

	console.error('  - cause() method: ok');
}

main();
