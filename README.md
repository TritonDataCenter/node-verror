# verror: rich JavaScript errors

This module provides several classes in support of Joyent's [Best Practices for
Error Handling in Node.js](http://www.joyent.com/developers/node/design/errors).
If you find any of the behavior here confusing or surprising, check out that
document first.

The error classes here support:

* printf-style arguments for the message
* chains of causes
* properties to provide extra information about the error

The classes here are:

* **VError**, for chaining errors while preserving each one's error message.
  This is useful in servers and command-line utilities when you want to
  propagate an error up a call stack, but allow various levels to add their own
  context.  See examples below.
* **WError**, for wrapping errors while hiding the lower-level messages from the
  top-level error.  This is useful for API endpoints where you don't want to
  expose internal error messages, but you still want to preserve the error chain
  for logging and debugging.
* **SError**, which is just like VError but interprets printf-style arguments
  more strictly.
* **MultiError**, which is just an Error representing a list of underlying
  errors.


# Demo

If nothing else, you can use VError as a drop-in replacement for the built-in
JavaScript Error class, with the addition of printf-style messages:

```javascript
var err = new VError('missing file: "%s"', '/etc/passwd');
console.log(err.message);
```

This prints:

    missing file: "/etc/passwd"

You can also pass a `cause` argument, which is any other Error object:

```javascript
var fs = require('fs');
var filename = '/nonexistent';
fs.stat(filename, function (err1) {
	var err2 = new VError(err1, 'stat "%s"', filename);
	console.error(err2.message);
});
```

This prints out:

    stat "/nonexistent": ENOENT, stat '/nonexistent'

which resembles how Unix programs typically report errors:

    $ sort /nonexistent
    sort: open failed: /nonexistent: No such file or directory

To match the Unixy feel, when you print out the error, just prepend the
program's name to the VError's `message`.  Or just call
[node-cmdutil.fail(your_verror)](https://github.com/joyent/node-cmdutil), which
does this for you.

You can get the next-level Error using `err.cause()`:

```javascript
console.error(err2.cause().message);
```

prints:

    ENOENT, stat '/nonexistent'

Of course, you can chain these as many times as you want, and it works with any
kind of Error:

```javascript
var err1 = new Error('No such file or directory');
var err2 = new VError(err1, 'failed to stat "%s"', '/junk');
var err3 = new VError(err2, 'request failed');
console.error(err3.message);
```

This prints:

    request failed: failed to stat "/junk": No such file or directory

The idea is that each layer in the stack annotates the error with a description
of what it was doing.  The end result is a message that explains what happened
at each level.

You can also decorate Error objects with additional information so that callers
can not only handle each kind of error differently, but also construct their own
error messages (e.g., to localize them, format them, group them by type, and so
on).  See the `info` constructor argument below.


# Reference: VError, WError, SError

VError, WError, and SError are convenient drop-in replacements for `Error` that
support printf-style arguments, first-class causes, informational properties,
and other useful features.


## Constructors

The VError constructor has several forms:

```javascript
/*
 * This is the most general form.  You can specify any supported options
 * (including "cause" and "info") this way.
 */
new VError(options, sprintf_args...)

/*
 * This is a useful shorthand when the only option you need is "cause".
 */
new VError(cause, sprintf_args...)

/*
 * This is a useful shorthand when you don't need any options at all.
 */
new VError(sprintf_args...)
```

All of these forms construct a new VError that behaves just like the built-in
JavaScript `Error` class, with some additional methods described below.

In the first form, `options` is a plain object with any of the following
optional properties:

Option name      | Type             | Meaning
---------------- | ---------------- | -------
`name`           | string           | Describes what kind of error this is.  This is intended for programmatic use to distinguish between different kinds of errors.  Note that in modern versions of Node.js, this name is ignored in the `stack` property value, but callers can still use the `name` property to get at it.
`cause`          | any Error object | Indicates that the new error was caused by `cause`.  See `cause()` below.  If unspecified, the cause will be `null`.
`strict`         | boolean          | If true, then `null` and `undefined` values in `sprintf_args` are passed through to `sprintf()`.  Otherwise, these are replaced with the strings `'null'`, and '`undefined`', respectively.
`constructorOpt` | function         | If specified, then the stack trace for this error ends at function `constructorOpt`.  Functions called by `constructorOpt` will not show up in the stack.  This is useful when this class is subclassed.
`info`           | object           | Specifies arbitrary informational properties that are available through the `info()` method.  See that method for details.

The second form is equivalent to using the first form with the specified `cause`
as the error's cause.  This form is distinguished from the first form because
the first argument is an Error.

The third form is equivalent to using the first form with all default option
values.  This form is distinguished from the other forms because the first
argument is not an object or an Error.

The `WError` constructor is used exactly the same way as the `VError`
constructor.  The `SError` constructor is also used the same way as the
`VError` constructor except that in all cases, the `strict` property is
overriden to `true.


## Public properties

`VError`, `WError`, and `SError` all provide the same public properties as
JavaScript's built-in Error objects.

Property name | Type   | Meaning
------------- | ------ | -------
`name`      | string | Programmatically-usable name of the error.
`message`   | string | Human-readable summary of the failure.  Programmatically-accessible details are provided through `info()` method.
`stack`     | string | Human-readable stack trace where the Error was constructed.

For all of these classes, the printf-style arguments passed to the constructor
are processed with `sprintf()` to form a message.  For `WError`, this becomes
the complete `message` property.  For `SError` and `VError`, this message is
prepended to the message of the cause, if any (with a suitable separator), and
the result becomes the `message` property.

The `stack` property is managed entirely by the underlying JavaScript
implementation.  It's generally implemented using a getter function because
constructing the human-readable stack trace is somewhat expensive.

## Public methods

### `cause()`

The `cause()` function returns the object specified as the cause in the
constructor.  If none was specified, it returns `null`.

### `info()`

Returns an object with all of the extra error information that's been associated
with this Error and all of its causes.  These are the properties passed in using
the `info` option to the constructor.  Properties not specified in the
constructor for this Error are implicitly inherited from this error's cause.

These properties are intended to provide programmatically-accessible metadata
about the error.  For an error that indicates a failure to resolve a DNS name,
informational properties might include the DNS name to be resolved, or even the
list of resolvers used to resolve it.  The values of these properties should
generally be plain objects (i.e., consisting only of null, undefined, numbers,
booleans, strings, and objects and arrays containing only other plain objects).


# Reference: MultiError

MultiError is an Error class that represents a group of Errors.  This is used
when you logically need to provide a single Error, but you want to preserve
information about multiple underying Errors.  A common case is when you execute
several operations in parallel and some of them fail.

MultiErrors are constructed as:

```javascript
new MultiError(error_list)
```

`error_list` is an array of at least one `Error` object.

The cause of the MultiError is the first error provided.  None of the other
`VError` options are supported.  The `message` for a MultiError consists the
`message` from the first error, prepended with a message indicating that there
were other errors.

For example:

```javascript
err = new MultiError([
    new Error('failed to resolve DNS name "abc.example.com"'),
    new Error('failed to resolve DNS name "def.example.com"'),
]);

console.error(err.message);
```

outputs:

    first of 2 errors: failed to resolve DNS name "abc.example.com"

## Public methods


### `errors()`

Returns an array of the errors used to construct this MultiError.


# Contributing

Contributions welcome.  Code should be "make prepush" clean.  To run "make
check", you'll need these tools:

* https://github.com/davepacheco/jsstyle
* https://github.com/davepacheco/javascriptlint

If you're changing something non-trivial or user-facing, you may want to submit
an issue first.
