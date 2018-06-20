"use strict";

/*
 * verror.js: richer JavaScript errors
 */

const sprintf = require('extsprintf').sprintf;
const AssertionError = require('assertion-error');
const inherits = require('inherits');
const assert = require('./assert');

const isError = assert.isError;
const isObject = assert.isObject;
const isString = assert.isString;
const isBoolean = assert.isBoolean;
const isFunc = assert.isFunc;

/*
 * Public interface
 */

/* So you can 'const VError = require('verror')' */
module.exports = VError;
/* For compatibility */
VError.VError = VError;
/* Other exported classes */
VError.SError = SError;
VError.WError = WError;
VError.MultiError = MultiError;

/*
 * Common function used to parse constructor arguments for VError, WError, and
 * SError.  Named arguments to this function:
 *
 *     strict		force strict interpretation of sprintf arguments, even
 *     			if the options in "argv" don't say so
 *
 *     argv		error's constructor arguments, which are to be
 *     			interpreted as described in README.md.  For quick
 *     			reference, "argv" has one of the following forms:
 *
 *          [ sprintf_args... ]           (argv[0] is a string)
 *          [ cause, sprintf_args... ]    (argv[0] is an Error)
 *          [ options, sprintf_args... ]  (argv[0] is an object)
 *
 * This function normalizes these forms, producing an object with the following
 * properties:
 *
 *    options           equivalent to "options" in third form.  This will never
 *    			be a direct reference to what the caller passed in
 *    			(i.e., it may be a shallow copy), so it can be freely
 *    			modified.
 *
 *    shortmessage      result of sprintf(sprintf_args), taking options.strict
 *    			into account as described in README.md.
 */
function parseConstructorArguments(args) {
  if (!isObject(args)) throw new AssertionError('args (object) is required');
  if (!isBoolean(args.strict)) throw new AssertionError('strict (bool) is required');
  if (!Array.isArray(args.argv)) throw new AssertionError('list of argv (array) is required');

  const argv = args.argv;
  let options;
  let sprintfArgs;

  /*
   * First, figure out which form of invocation we've been given.
   */
  if (argv.length === 0) {
    options = {};
    sprintfArgs = [];
  } else if (isError(argv[0])) {
    options = { cause: argv[0] };
    sprintfArgs = argv.slice(1);
  } else if (typeof argv[0] === 'object') {
    options = {};
    for (const k in argv[0]) {
      options[k] = argv[0][k];
    }
    sprintfArgs = argv.slice(1);
  } else {
    if (!isString(argv[0])) {
      throw new AssertionError(
        'first argument to VError, SError, or WError ' +
        'constructor must be a string, object, or Error'
      );
    }
    options = {};
    sprintfArgs = argv;
  }

  /*
   * Now construct the error's message.
   *
   * extsprintf (which we invoke here with our caller's arguments in order
   * to construct this Error's message) is strict in its interpretation of
   * values to be processed by the "%s" specifier.  The value passed to
   * extsprintf must actually be a string or something convertible to a
   * String using .toString().  Passing other values (notably "null" and
   * "undefined") is considered a programmer error.  The assumption is
   * that if you actually want to print the string "null" or "undefined",
   * then that's easy to do that when you're calling extsprintf; on the
   * other hand, if you did NOT want that (i.e., there's actually a bug
   * where the program assumes some variable is non-null and tries to
   * print it, which might happen when constructing a packet or file in
   * some specific format), then it's better to stop immediately than
   * produce bogus output.
   *
   * However, sometimes the bug is only in the code calling VError, and a
   * programmer might prefer to have the error message contain "null" or
   * "undefined" rather than have the bug in the error path crash the
   * program (making the first bug harder to identify).  For that reason,
   * by default VError converts "null" or "undefined" arguments to their
   * string representations and passes those to extsprintf.  Programmers
   * desiring the strict behavior can use the SError class or pass the
   * "strict" option to the VError constructor.
   */
  if (!isObject(options)) throw new AssertionError('options (object) is required');

  if (!options.strict && !args.strict) {
    sprintfArgs = sprintfArgs.map(function (a) {
      return a === null ? 'null' : a === undefined ? 'undefined' : a;
    });
  }

  return {
    options,
    shortmessage: sprintfArgs.length === 0 ? '' : sprintf.apply(null, sprintfArgs)
  };
}

/*
 * See README.md for reference documentation.
 */
function VError() {
  const args = Array.prototype.slice.call(arguments, 0);

  /*
   * This is a regrettable pattern, but JavaScript's built-in Error class
   * is defined to work this way, so we allow the constructor to be called
   * without "new".
   */
  if (!(this instanceof VError)) {
    const obj = Object.create(VError.prototype);
    VError.apply(obj, arguments);
    return obj;
  }

  /*
   * For convenience and backwards compatibility, we support several
   * different calling forms.  Normalize them here.
   */
  const parsed = parseConstructorArguments({ argv: args, strict: false });

  /*
   * If we've been given a name, apply it now.
   */
  if (parsed.options.name) {
    if (!isString(parsed.options.name)) throw new AssertionError('error\'s "name" must be a string');

    this.name = parsed.options.name;
  }

  /*
   * For debugging, we keep track of the original short message (attached
   * this Error particularly) separately from the complete message (which
   * includes the messages of our cause chain).
   */
  this.jse_shortmsg = parsed.shortmessage;
  let message = parsed.shortmessage;

  /*
   * If we've been given a cause, record a reference to it and update our
   * message appropriately.
   */
  const cause = parsed.options.cause;
  if (cause) {
    if (!isError(cause)) throw new AssertionError('cause must be an Error');

    this.jse_cause = cause;

    if (!parsed.options.skipCauseMessage) {
      message += `: ${cause.message}`;
    }
  }

  /*
   * If we've been given an object with properties, shallow-copy that
   * here.  We don't want to use a deep copy in case there are non-plain
   * objects here, but we don't want to use the original object in case
   * the caller modifies it later.
   */
  this.jse_info = {};
  if (parsed.options.info) {
    for (const k in parsed.options.info) {
      this.jse_info[k] = parsed.options.info[k];
    }
  }

  this.message = message;
  Error.call(this, message);

  if (Error.captureStackTrace) {
    const ctor = parsed.options.constructorOpt || this.constructor;
    Error.captureStackTrace(this, ctor);
  }



  return this;
}

inherits(VError, Error);
VError.prototype.name = 'VError';

VError.prototype.toString = function () {
  let str = this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name;
  if (this.message) str += `: ${this.message}`;

  return str;
}

/*
 * This method is provided for compatibility.  New callers should use
 * VError.cause() instead.  That method also uses the saner `null` return value
 * when there is no cause.
 */
VError.prototype.cause = function () {
  const cause = VError.cause(this);
  return cause === null ? undefined : cause;
}

/*
 * Static methods
 *
 * These class-level methods are provided so that callers can use them on
 * instances of Errors that are not VErrors.  New interfaces should be provided
 * only using static methods to eliminate the class of programming mistake where
 * people fail to check whether the Error object has the corresponding methods.
 */

VError.cause = function (err) {
  if (!isError(err)) throw new AssertionError('err must be an Error');

  return isError(err.jse_cause) ? err.jse_cause : null;
}

VError.info = function (err) {
  if (!isError(err)) throw new AssertionError('err must be an Error');

  const cause = VError.cause(err);
  const rv = cause !== null ? VError.info(cause) : {};

  if (typeof err.jse_info == 'object' && err.jse_info !== null) {
    for (const k in err.jse_info) {
      rv[k] = err.jse_info[k];
    }
  }

  return rv;
}

VError.findCauseByName = function (err, name) {
  if (!isError(err)) throw new AssertionError('err must be an Error');
  if (!isString(name)) throw new AssertionError('name (string) is required');
  if (name.length <= 0) throw new AssertionError('name cannot be empty');

  for (let cause = err; cause !== null; cause = VError.cause(cause)) {
    if (!isError(err)) throw new AssertionError('cause must be an Error');

    if (cause.name == name) {
      return cause;
    }
  }

  return null;
}

VError.hasCauseWithName = function (err, name) {
  return VError.findCauseByName(err, name) !== null;
}

VError.fullStack = function (err) {
  if (!isError(err)) throw new AssertionError('err must be an Error');

  const cause = VError.cause(err);

  if (cause) {
    return `${err.stack}\ncaused by: ${VError.fullStack(cause)}`;
  }

  return err.stack;
}

VError.errorFromList = function (errors) {
  if (!Array.isArray(errors)) throw new AssertionError('list of errors (array) is required');

  errors.forEach(function (error) {
    if (!isObject(error)) throw new AssertionError('errors ([object]) is required');
  });

  if (errors.length === 0) {
    return null;
  }

  errors.forEach(function (error) {
    if (!isError(error)) throw new AssertionError('error must be an Error');
  });

  if (errors.length == 1) {
    return errors[0];
  }

  return new MultiError(errors);
}

VError.errorForEach = function (err, func) {
  if (!isError(err)) throw new AssertionError('err must be an Error');
  if (!isFunc(func)) throw new AssertionError('func (func) is required');

  if (err instanceof MultiError) {
    for (const error of err.errors()) {
      func(error);
    }
  } else {
    func(err);
  }
}


/*
 * SError is like VError, but stricter about types.  You cannot pass "null" or
 * "undefined" as string arguments to the formatter.
 */
function SError() {
  const args = Array.prototype.slice.call(arguments, 0);
  if (!(this instanceof SError)) {
    const obj = Object.create(SError.prototype);
    SError.apply(obj, arguments);
    return obj;
  }

  const parsed = parseConstructorArguments({ argv: args, strict: true });

  const options = parsed.options;
  VError.call(this, options, '%s', parsed.shortmessage);

  return this;
}

/*
 * We don't bother setting SError.prototype.name because once constructed,
 * SErrors are just like VErrors.
 */
inherits(SError, VError);


/*
 * Represents a collection of errors for the purpose of consumers that generally
 * only deal with one error.  Callers can extract the individual errors
 * contained in this object, but may also just treat it as a normal single
 * error, in which case a summary message will be printed.
 */
function MultiError(errors) {
  if (!Array.isArray(errors)) throw new AssertionError('list of errors (array) is required');
  if (errors.length <= 0) throw new AssertionError('must be at least one error is required');

  this.ase_errors = errors;

  VError.call(
    this,
    { cause: errors[0] }, 'first of %d error%s', errors.length, errors.length == 1 ? '' : 's'
  );
}

inherits(MultiError, VError);
MultiError.prototype.name = 'MultiError';

MultiError.prototype.errors = function () {
  return this.ase_errors.slice(0);
}

/*
 * See README.md for reference details.
 */
function WError() {
  const args = Array.prototype.slice.call(arguments, 0);
  if (!(this instanceof WError)) {
    const obj = Object.create(WError.prototype);
    WError.apply(obj, args);
    return obj;
  }

  const parsed = parseConstructorArguments({ argv: args, strict: false });

  const options = parsed.options;
  options.skipCauseMessage = true;
  VError.call(this, options, '%s', parsed.shortmessage);

  return this;
}

inherits(WError, VError);
WError.prototype.name = 'WError';

WError.prototype.toString = function () {
  let str = this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name;
  if (this.message) str += `: ${this.message}`;
  if (this.jse_cause && this.jse_cause.message) str += `; caused by ${this.jse_cause.toString()}`;

  return str;
}

/*
 * For purely historical reasons, WError's cause() function allows you to set
 * the cause.
 */
WError.prototype.cause = function (c) {
  if (isError(c)) this.jse_cause = c;

  return this.jse_cause;
}
