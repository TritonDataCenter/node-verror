/*
 * test/common.js: common utility functions used in multiple tests
 */

exports.cleanStack = cleanStack;

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
