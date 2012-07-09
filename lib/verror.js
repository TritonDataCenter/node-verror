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
exports.MultiError = MultiError;

/*
 * Like JavaScript's built-in Error class, but supports a "cause" argument and a
 * printf-style message.  The cause argument can be null.
 */
function VError(options)
{
	var args, causedBy, ctor, tailmsg;

	if (options instanceof Error || typeof (options) === 'object') {
		args = Array.prototype.slice.call(arguments, 1);
	} else {
		args = Array.prototype.slice.call(arguments, 0);
		options = undefined;
	}

	tailmsg = args.length > 0 ?
	    mod_extsprintf.sprintf.apply(null, args) : '';
	this.jse_shortmsg = tailmsg;

	if (options) {
		causedBy = options.cause || options;
		mod_assert.ok(causedBy instanceof Error);
		this.jse_cause = causedBy;
		this.jse_summary = tailmsg + ': ' + causedBy.message;
	} else {
		this.jse_summary = tailmsg;
	}

	this.message = this.jse_summary;
	Error.apply(this, [ this.jse_summary ]);

	if (Error.captureStackTrace) {
		ctor = options ? options.constructorOpt : undefined;
                ctor = ctor || arguments.callee;
		Error.captureStackTrace(this, ctor);
	}
}
mod_util.inherits(VError, Error);
VError.prototype.constructor = VError;
VError.prototype.name = VError;

VError.prototype.toString = function toString()
{
	return (this.jse_summary);
};

VError.prototype.cause = function cause()
{
	return (this.jse_cause);
};


/*
 * Represents a collection of errors for the purpose of consumers that generally
 * only deal with one error.  Callers can extract the individual errors
 * contained in this object, but may also just treat it as a normal single
 * error, in which case a summary message will be printed.
 */
function MultiError(errors)
{
	mod_assert.ok(errors.length > 0);
	this.ase_errors = errors;

	VError.call(this, errors[0], 'first of %d error%s',
	    errors.length, errors.length == 1 ? '' : 's');
}

mod_util.inherits(MultiError, VError);
