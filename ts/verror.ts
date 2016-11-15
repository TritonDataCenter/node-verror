import VError = require("../lib/verror");

const verror = new VError(new Error(), "test %s", "blah");
const verrorOts = new VError({
    cause: new Error(),
    strict: false
}, "", "");

new VError.SError(new Error(), "test").name;
new VError.WError(new Error(), "test").toString();
new VError.MultiError([new Error()]);

VError.cause(verror);
VError.cause(new Error());

VError.info(verror);

VError.findCauseByName(verrorOts, "test");

const stack: string = VError.fullStack(verror);
