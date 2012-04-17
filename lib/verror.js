/*
 * verror.js: richer JavaScript errors
 */

var mod_assert = require('assert');
var mod_util = require('util');

var mod_extsprintf = require('extsprintf');

/*
 * Public interface
 */
exports.VError = VError;

/*
 * Like JavaScript's built-in Error class, but supports a "cause" argument and a
 * printf-style message.  The cause argument can be null.
 */
function VError(cause)
{
	var args, tailmsg;

	args = Array.prototype.slice.call(arguments, 1);
	tailmsg = args.length > 0 ?
	    mod_extsprintf.sprintf.apply(null, args) : '';
	this.jse_shortmsg = tailmsg;

	if (cause) {
		mod_assert.ok(cause instanceof Error);
		this.jse_cause = cause;
		this.jse_summary = tailmsg + ': ' + cause.message;
	} else {
		this.jse_summary = tailmsg;
	}

	this.message = this.jse_summary;
	Error.apply(this, [ this.jse_summary ]);

	if (Error.captureStackTrace)
		Error.captureStackTrace(this, arguments.callee);
}

VError.prototype = new Error();
VError.prototype.constructor = VError;
VError.prototype.name = VError;

VError.prototype.toString = function ()
{
	return (this.jse_summary);
};

VError.prototype.cause = function ()
{
	return (this.jse_cause);
};
