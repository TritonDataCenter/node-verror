var mod_extsprintf = require('extsprintf');
var mod_verror = require('../lib/verror');

console.log(mod_extsprintf.sprintf('%r', new mod_verror.VError()));
console.log(mod_extsprintf.sprintf('%r',
    new mod_verror.VError('operation failed: %s', 'hello')));
