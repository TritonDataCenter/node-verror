/*
 * test/common.js: common utility functions used in multiple tests
 */

exports.cleanStack = cleanStack;
exports.oldNode = oldNode;

/*
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 */
function cleanStack(stacktxt)
{
	var re = new RegExp('\\(/.*/tst.*js:\\d+:\\d+\\)', 'gm');
	stacktxt = stacktxt.replace(re, '(dummy filename)');
	return (stacktxt);
}

/*
 * Node's behavior with respect to Error's names and messages changed
 * significantly with v0.12, so a number of tests regrettably need to check for
 * that.
 */
function oldNode()
{
	return (/^0\.10\./.test(process.versions['node']));
}
