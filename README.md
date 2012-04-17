# verror: richer JavaScript errors

This module provides VError, which is like JavaScript's built-in Error class,
but supports a "cause" argument and a printf-style message.  The cause argument
can be null.  For example:

    if (err)
        throw (new VError(err, 'operation "%s" failed', opname));

If err.message is "file not found" and "opname" is "rm", then the thrown
exception's toString() would return:

       operation "rm" failed: file not found

This is useful for annotating exceptions up the stack, rather than getting an
extremely low-level error (like "file not found") for a potentially much higher
level operation.

Additionally, when printed using node-extsprintf using %r, each exception's
stack is printed.


# Example

First, install it:

    # npm install verror

Now, use it:

    var mod_fs = require('fs');
    var mod_extsprintf = require('extsprintf');
    var mod_verror = require('../lib/verror');
    
    mod_fs.stat('/nonexistent', function (err) {
    	console.log(mod_extsprintf.sprintf('%r',
    	    new mod_verror.VError(err, 'operation failed')));
    });

outputs:

    EXCEPTION: VError: operation failed: ENOENT, no such file or directory '/nonexistent'
        at Object.oncomplete (/home/dap/node-verror/examples/simple.js:7:6)
    Caused by: EXCEPTION: Error: Error: ENOENT, no such file or directory '/nonexistent'
