var VError = require('../lib/verror');

var err1 = new VError('something bad happened');
/* ... */
var err2 = new VError(err1, 'something really bad happened here');

console.log(VError.fullStack(err2));
