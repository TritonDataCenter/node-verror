/*
 * tst.findcause.js: tests findCauseByName()/hasCauseWithName().
 */

var mod_assert = require('assert');
var mod_util = require('util');
var mod_verror = require('../lib/verror');

var SError = mod_verror.SError;
var VError = mod_verror.VError;
var WError = mod_verror.WError;

var findCauseByName = VError.findCauseByName;
var hasCauseWithName = VError.hasCauseWithName;

/*
 * This class deliberately doesn't inherit from our error classes.
 */
function MyError()
{
	Error.call(this, 'here is my error');
}

mod_util.inherits(MyError, Error);
MyError.prototype.name = 'MyError';


function main()
{
	/*
	 * We'll build up a cause chain using each of our classes and make sure
	 * that findCauseByName() traverses all the way to the bottom.  This
	 * ends up testing that findCauseByName() works with each of these
	 * classes.
	 */
	var err1, err2, err3, err4;

	err1 = new MyError();
	err2 = new VError({
	    'name': 'ErrorTwo',
	    'cause': err1
	}, 'basic verror (number two)');
	err3 = new SError({
	    'name': 'ErrorThree',
	    'cause': err2
	}, 'strict error (number three)');
	err4 = new WError({
	    'name': 'ErrorFour',
	    'cause': err3
	}, 'werror (number four)');

	/*
	 * Our top-level error should have all of the causes in its chain.
	 */
	mod_assert.strictEqual(err4, findCauseByName(err4, 'ErrorFour'));
	mod_assert.strictEqual(true, hasCauseWithName(err4, 'ErrorFour'));
	mod_assert.strictEqual(err3, findCauseByName(err4, 'ErrorThree'));
	mod_assert.strictEqual(true, hasCauseWithName(err4, 'ErrorThree'));
	mod_assert.strictEqual(err2, findCauseByName(err4, 'ErrorTwo'));
	mod_assert.strictEqual(true, hasCauseWithName(err4, 'ErrorTwo'));
	mod_assert.strictEqual(err1, findCauseByName(err4, 'MyError'));
	mod_assert.strictEqual(true, hasCauseWithName(err4, 'MyError'));

	/*
	 * By contrast, the next-level errors should have only their own causes.
	 */
	mod_assert.strictEqual(null, findCauseByName(err3, 'ErrorFour'));
	mod_assert.strictEqual(false, hasCauseWithName(err3, 'ErrorFour'));
	mod_assert.strictEqual(err3, findCauseByName(err3, 'ErrorThree'));
	mod_assert.strictEqual(true, hasCauseWithName(err3, 'ErrorThree'));
	mod_assert.strictEqual(err2, findCauseByName(err3, 'ErrorTwo'));
	mod_assert.strictEqual(true, hasCauseWithName(err3, 'ErrorTwo'));
	mod_assert.strictEqual(err1, findCauseByName(err3, 'MyError'));
	mod_assert.strictEqual(true, hasCauseWithName(err3, 'MyError'));

	mod_assert.strictEqual(null, findCauseByName(err2, 'ErrorFour'));
	mod_assert.strictEqual(false, hasCauseWithName(err2, 'ErrorFour'));
	mod_assert.strictEqual(null, findCauseByName(err2, 'ErrorThree'));
	mod_assert.strictEqual(false, hasCauseWithName(err2, 'ErrorThree'));
	mod_assert.strictEqual(err2, findCauseByName(err2, 'ErrorTwo'));
	mod_assert.strictEqual(true, hasCauseWithName(err2, 'ErrorTwo'));
	mod_assert.strictEqual(err1, findCauseByName(err2, 'MyError'));
	mod_assert.strictEqual(true, hasCauseWithName(err2, 'MyError'));

	/*
	 * These functions must work on non-VError errors.
	 */
	mod_assert.strictEqual(err1, findCauseByName(err1, 'MyError'));
	mod_assert.strictEqual(true, hasCauseWithName(err1, 'MyError'));
	mod_assert.strictEqual(null, findCauseByName(err1, 'ErrorTwo'));
	mod_assert.strictEqual(false, hasCauseWithName(err1, 'ErrorTwo'));

	err1 = new Error('a very basic error');
	mod_assert.strictEqual(err1, findCauseByName(err1, 'Error'));
	mod_assert.strictEqual(true, hasCauseWithName(err1, 'Error'));
	mod_assert.strictEqual(null, findCauseByName(err1, 'MyError'));
	mod_assert.strictEqual(false, hasCauseWithName(err1, 'MyError'));

	/*
	 * These functions should throw an Error when given bad argument types.
	 */
	mod_assert.throws(function () { findCauseByName(null, 'AnError'); },
	    /err must be an Error/);
	mod_assert.throws(function () { hasCauseWithName(null, 'AnError'); },
	    /err must be an Error/);
	mod_assert.throws(function () { findCauseByName(err1, null); },
	    /string.*is required/);
	mod_assert.throws(function () { hasCauseWithName(err1, null); },
	    /string.*is required/);

	console.error('test passed');
}

main();
