/*
 * verror.js: richer JavaScript errors
 * XXX consider renaming _cause to cause?  simplifies a lot, but is a big flag day
 * XXX node uses errno as numeric value, "code" as symbolic (e.g., "ENOENT")
 */

var mod_assert = require('assert');
var mod_util = require('util');

var sprintf = require('extsprintf').sprintf;

/*
 * Public interface
 */

/* So you can 'var VError = require('verror')' */
module.exports = VError;
/* For compatibility */
VError.VError = VError;
/* Other exported classes */
VError.WError = WError;
VError.MultiError = MultiError;

/*
 * VError(sprintf_args...)
 * VError(cause, sprintf_args...)
 * VError(options, sprintf_args...)
 *
 * VError is similar to JavaScript's built-in Error class, but supports a
 * "cause" argument (another error), a printf-style message, and an easy way to
 * tack on extra properties.  See README.md for details.
 */
function VError(options)
{
	var args, message, causedBy, ctor;

	if (options instanceof Error || typeof (options) === 'object') {
		args = Array.prototype.slice.call(arguments, 1);
	} else {
		args = Array.prototype.slice.call(arguments, 0);
		options = undefined;
	}

	message = args.length > 0 ?  sprintf.apply(null, args) : '';

	if (options) {
		if (options.cause && options.cause instanceof Error) {
			causedBy = options.cause;
		} else if (options instanceof Error) {
			causedBy = options;
			options = undefined;
		}

		if (causedBy && (causedBy instanceof Error)) {
			this._cause = causedBy;
			message += ': ' + causedBy.message;
		}
	}

	this.message = message;
	Error.call(this, message);

	if (Error.captureStackTrace) {
		ctor = options ? options.constructorOpt : undefined;
		ctor = ctor || arguments.callee;
		Error.captureStackTrace(this, ctor);
	}

	var prop;
	if (this._cause) {
		for (prop in this._cause) {
			if (!this._cause.hasOwnProperty(prop) ||
			    this.hasOwnProperty(prop) ||
			    prop == 'name')
				continue;

			this[prop] = this._cause[prop];
		}
	}

	for (prop in options) {
		/*
		 * Skip cause() to avoid clobbering our class function of the
		 * same name.  Skip _cause, message, and stack, since these are
		 * per-error and never propagated up the error chain.
		 */
		if (prop == 'cause' ||
		    prop == '_cause' ||
		    prop == 'message' ||
		    prop == 'stack')
			continue;

		this[prop] = options[prop];
	}
}

mod_util.inherits(VError, Error);
VError.prototype.name = 'VError';

VError.prototype.toString = function ve_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;

	return (str);
};

VError.prototype.cause = function ve_cause()
{
	return (this._cause);
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

MultiError.prototype.errors = function me_errors()
{
	return (this.ase_errors.slice(0));
};


/*
 * Like JavaScript's built-in Error class, but supports a "cause" argument which
 * is wrapped, not "folded in" as with VError.	Accepts a printf-style message.
 * The cause argument can be null.
 */
function WError(options)
{
	Error.call(this);

	var args, cause, ctor;
	if (typeof (options) === 'object') {
		args = Array.prototype.slice.call(arguments, 1);
	} else {
		args = Array.prototype.slice.call(arguments, 0);
		options = undefined;
	}

	if (args.length > 0) {
		this.message = sprintf.apply(null, args);
	} else {
		this.message = '';
	}

	if (options) {
		if (options instanceof Error) {
			cause = options;
		} else {
			cause = options.cause;
			ctor = options.constructorOpt;
		}
	}

	Error.captureStackTrace(this, ctor || this.constructor);
	if (cause)
		this.cause(cause);
}

mod_util.inherits(WError, Error);
WError.prototype.name = 'WError';

WError.prototype.toString = function we_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;
	if (this.we_cause && this.we_cause.message)
		str += '; caused by ' + this.we_cause.toString();

	return (str);
};

WError.prototype.cause = function we_cause(c)
{
	if (c instanceof Error)
		this.we_cause = c;

	return (this.we_cause);
};
