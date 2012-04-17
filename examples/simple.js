var mod_fs = require('fs');
var mod_extsprintf = require('extsprintf');
var mod_verror = require('../lib/verror');

mod_fs.stat('/nonexistent', function (err) {
	console.log(mod_extsprintf.sprintf('%r',
	    new mod_verror.VError(err, 'operation failed')));
});
