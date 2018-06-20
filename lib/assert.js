module.exports = {
  isError,
  isObject,
  isString,
  isBoolean,
  isFunc,
};

function isError(arg) {
  return Object.prototype.toString.call(arg) === '[object Error]' || arg instanceof Error;
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isString(arg) {
  return typeof arg === 'string';
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isFunc(arg) {
  return typeof arg === 'function';
}
