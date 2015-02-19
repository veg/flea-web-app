var getType = function (elem) {
  return Object.prototype.toString.call(elem).slice(8, -1);
};

export var isDate = function (elem) {
  return getType(elem) === 'Object';
};

export var isString = function (elem) {
  return getType(elem) === 'String';
};

export var parse_date = d3.time.format("%Y%m%d").parse;

export var format_date = d3.time.format("%B %Y");

