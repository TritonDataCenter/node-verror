import VError = require("../lib/verror");

const verror = VError(new Error(), "test %s", "blah");
const verrorOts = new VError({
    cause: new Error(),
    strict: false
}, "", "");

new VError.SError(new Error(), "test");
new VError.WError(new Error(), "test");
new VError.MultiError(new Error(), "test");

VError.cause(verror);
VError.cause(new Error());

VError.info(verror);

VError.findCauseByName(verrorOts, "test");

const stack: string = VError.fullStack(verror);

const methodVerror = VError("as a method");
