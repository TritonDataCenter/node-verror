/*
 * tst.inherit.js: test that inheriting from VError and WError work as expected.
 */

var mod_assert = require('assert');
var mod_util = require('util');
var mod_testcommon = require('./common');

var VError = require('../lib/verror');
var WError = VError.WError;
var err, suberr, stack, nodestack;

function VErrorChild()
{
	VError.apply(this, Array.prototype.slice.call(arguments));
}

mod_util.inherits(VErrorChild, VError);
VErrorChild.prototype.name = 'VErrorChild';


function WErrorChild()
{
	WError.apply(this, Array.prototype.slice.call(arguments));
}

mod_util.inherits(WErrorChild, WError);
WErrorChild.prototype.name = 'WErrorChild';

/*
 * Save the generic parts of all stack traces so we can avoid hardcoding
 * Node-specific implementation details in our testing of stack traces.
 * The stack trace limit has to be large enough to capture all of Node's frames,
 * which are more than the default (10 frames) in Node v6.x.
 */
Error.stackTraceLimit = 20;
nodestack = new Error().stack.split('\n').slice(2).join('\n');

suberr = new Error('root cause');
err = new VErrorChild(suberr, 'top');
mod_assert.ok(err instanceof Error);
mod_assert.ok(err instanceof VError);
mod_assert.ok(err instanceof VErrorChild);
mod_assert.equal(err.cause(), suberr);
mod_assert.equal(err.message, 'top: root cause');
mod_assert.equal(err.toString(), 'VErrorChild: top: root cause');
stack = mod_testcommon.cleanStack(err.stack);
mod_assert.equal(stack, [
    'VErrorChild: top: root cause',
    '    at Object.<anonymous> (dummy filename)',
    nodestack
].join('\n'));

suberr = new Error('root cause');
err = new WErrorChild(suberr, 'top');
mod_assert.ok(err instanceof Error);
mod_assert.ok(err instanceof WError);
mod_assert.ok(err instanceof WErrorChild);
mod_assert.equal(err.cause(), suberr);
mod_assert.equal(err.message, 'top');
mod_assert.equal(err.toString(),
	'WErrorChild: top; caused by Error: root cause');
stack = mod_testcommon.cleanStack(err.stack);

/*
 * On Node 0.10 and earlier, the 'stack' property appears to use the error's
 * toString() method.  On newer versions, it appears to use the message
 * property the first time err.stack is accessed (_not_ when it was
 * constructed).  Since the point of WError is to omit the cause messages from
 * the WError's message, there's no way to have the err.stack property show the
 * detailed message in Node 0.12 and later.
 */
if (mod_testcommon.oldNode()) {
	mod_assert.equal(stack, [
	    'WErrorChild: top; caused by Error: root cause',
	    '    at Object.<anonymous> (dummy filename)',
	    nodestack
	].join('\n'));
} else {
	mod_assert.equal(stack, [
	    'WErrorChild: top',
	    '    at Object.<anonymous> (dummy filename)',
	    nodestack
	].join('\n'));
}

/*
 * Test that "<Ctor>.toString()" uses the constructor name, so that setting
 * "<Ctor>.prototype.name" isn't necessary.
 */
function VErrorChildNoName() {
	VError.apply(this, Array.prototype.slice.call(arguments));
}
mod_util.inherits(VErrorChildNoName, VError);
err = new VErrorChildNoName('top');
mod_assert.equal(err.toString(), 'VErrorChildNoName: top');

function WErrorChildNoName() {
	WError.apply(this, Array.prototype.slice.call(arguments));
}
mod_util.inherits(WErrorChildNoName, WError);
err = new WErrorChildNoName('top');
mod_assert.equal(err.toString(), 'WErrorChildNoName: top');


/*
 * Test that `<Ctor>.prototype.name` can be used for the `.toString()`
 * when the ctor is anonymous.
 */
var VErrorChildAnon = function () {
	VError.apply(this, Array.prototype.slice.call(arguments));
};
mod_util.inherits(VErrorChildAnon, VError);
VErrorChildAnon.prototype.name = 'VErrorChildAnon';
err = new VErrorChildAnon('top');
mod_assert.equal(err.toString(), 'VErrorChildAnon: top');

var WErrorChildAnon = function () {
	WError.apply(this, Array.prototype.slice.call(arguments));
};
mod_util.inherits(WErrorChildAnon, WError);
WErrorChildAnon.prototype.name = 'WErrorChildAnon';
err = new WErrorChildAnon('top');
mod_assert.equal(err.toString(), 'WErrorChildAnon: top');

/*
 * Test that we get an appropriate exception name in toString() output.
 */
err = new VError('top');
err.name = 'CustomNameError';
mod_assert.equal(err.toString(), 'CustomNameError: top');

err = new WError('top');
err.name = 'CustomNameError';
mod_assert.equal(err.toString(), 'CustomNameError: top');
