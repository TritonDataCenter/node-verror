# verror: richer JavaScript errors

This module provides two classes in support of Joyent's [Best Practices for Error
Handling in Node.js](http://www.joyent.com/developers/node/design/errors).  If
you find any of the behavior here confusing or surprising, check out that
document.

This module provides:

* VError, for chaining errors while preserving each one's error message, and
* WError, for wrapping errors while hiding the lower-level messages from the
  top-level error.  This is useful for API endpoints where you don't want to
  expose internal error messages, but you still want to preserve the error chain
  for logging and debugging.

## printf-style Error constructor

Both VError and WError support printf-style error messages using
[extsprintf](https://github.com/davepacheco/node-extsprintf).  If nothing else,
you can use VError as a drop-in replacement for the built-in JavaScript Error
class, with the addition of printf-style messages:

```javascript
var VError = require('verror');

var filename = '/etc/passwd';
var err = new VError('missing file: "%s"', filename);
console.log(err.message);
```

This prints:

    missing file: "/etc/passwd"

`err.stack` works the same as for built-in errors:

```javascript
console.log(err.stack);
```

This prints:

    missing file: "/etc/passwd"
        at Object.<anonymous> (/Users/dap/node-verror/examples/varargs.js:4:11)
        at Module._compile (module.js:449:26)
        at Object.Module._extensions..js (module.js:467:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Module.runMain (module.js:492:10)
        at process.startup.processNextTick.process._tickCallback (node.js:244:9)


## Causes

You can also pass a `cause` argument, which is another Error.  For example:

```javascript
var fs = require('fs');
var VError = require('verror');

var filename = '/nonexistent';
fs.stat(filename, function (err1) {
	var err2 = new VError(err1, 'stat "%s"', filename);
	console.error(err2.message);
});
```

This prints out:

    stat failed: ENOENT, stat '/nonexistent'

which resembles how Unix programs typically report errors:

    $ sort /nonexistent
    sort: open failed: /nonexistent: No such file or directory

To match the Unixy feel, just prepend the program's name to the VError's
`message`.

You can also get the next-level Error using `err.cause()`:

```javascript
console.error(err2.cause().message);
```

prints:

    ENOENT, stat '/nonexistent'

Of course, you can nest these as many times as you want:

```javascript
var VError = require('verror');
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


## Extra properties

As described in Joyent's [Best Practices for Node.js Error
Handling](http://www.joyent.com/developers/node/design/errors), it's useful to
decorate Error objects with additional properties so that callers can not only
handle each kind of error differently, but also construct their own error
messages (e.g., to localize them, format them, aggregate them by type, and so
on).  To add properties to an Error, pass them in an object as the first
argument.  For example:

    var VError = require('verror');
    var err1 = new VError({
	'remote_ip': '127.0.0.1'
    }, 'couldn\'t connect to host "%s"', '127.0.0.1');
    console.log(err1.message);
    console.log(err1.remote_ip);

prints:

    couldn't connect to host "127.0.0.1"
    127.0.0.1

If this error becomes the "cause" of another error, these properties are
shallow-copied into the parent error.  This way, you can wrap errors without
worrying about losing the extra information provided by the lower-level errors.

The special properties "message" and "stack" are ignored.  The special property
"cause" is used as the error's cause.


## WError: wrap layered errors

Sometimes you don't want an Error's "message" field to include the details of
all of the low-level errors, but you still want to be able to get at them
programmatically.  For example, in an HTTP server, you probably don't want to
spew all of the low-level errors back to the client, but you do want to include
them in the audit log entry for the request.  In that case, you can use a
WError, which is created exactly like VError (and also supports both
printf-style arguments and an optional cause), but the resulting "message" only
contains the top-level error.  It's also more verbose, including the class
associated with each error in the cause chain.  Using the same example above,
but replacing `err3`'s VError with WError, we get this output:

    request failed

That's what we wanted -- just a high-level summary for the client.  But we can
get the object's toString() for the full details:

    WError: request failed; caused by WError: failed to stat "/nonexistent";
    caused by Error: No such file or directory

# Reference

## VError(`sprintf_args...`)

Constructs a new VError that behaves just like the built-in JavaScript `Error`
class.  The error's `message` is constructed by passing the `sprintf_args` to
node-extsprintf, so you can use a format string, as in `VError('file not found:
"%s"', filename)`.  The error has no `cause` (`cause()` returns null) and no
additional properties.

## VError(`cause`, `sprintf_args...`) (where `cause` is an instance of `Error`)

Similar to the first invocation, but after formatting `message` as described
above, the message is combined with `cause.message`.  `cause()` on the new
object returns `cause`.  Properties of `cause` other than `name`, `message`, and
`stack` are shallow-copied into the new error.

## VError(`options`, `sprintf_args...`)

Similar to the first invocation, but supports setting additional properties on
the new error.  `options` may contain:

* `cause`: If present, this works like the `cause` argument to the second
  invocation.  Otherwise, the new error has no cause.
* `message`, `stack`: ignored
* any other properties: shallow-copied directly into the new error object.

# Contributing

Contributions welcome.  Code should be "make check" clean.  To run "make check",
you'll need these tools:

* https://github.com/davepacheco/jsstyle
* https://github.com/davepacheco/javascriptlint

If you're changing something non-trivial or user-facing, you may want to submit
an issue first.
