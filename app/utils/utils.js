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

export var htmlTable1D = function(data, header) {
  return htmlTable(data.map(function(elt) { return [elt]; }), header);
};


export var htmlTable = function(data, header) {
  if (data.length === 0) {
    return "<table></table>";
  }
  var result = '<table class="table-striped table table-hover">';
  if (header) {
    result += '<thead>';
    result += '<trow>';
    for (var k=0; k<header.length; k++) {
      result += '<th>';
      result += header[k];
      result += '</th>';
    }
    result += '</trow>';
    result += '</thead>';
  }
  result += '<tbody>';
  for (var i=0; i<data.length; i++) {
    result += '<tr>';
    for (var j=0; j<data[i].length; j++) {
      result += '<td>';
      result += data[i][j];
      result += '</td>';

    }
    result += '</tr>';
  }
  result += '</tbody>';
  result += '</table>';
  return result;
};


export var regexRanges = function(regex, string) {
  var indices = [];
  var result;
  var r = new RegExp(regex, 'g');
  while ((result = r.exec(string)) !== null) {
    indices.push([result.index, result.index + result[0].length-1]);
  }
  return indices;
};


export var sumArray = function(collection, accessor) {
  var total = 0;
  if (!accessor) {
    accessor = function(a) {
      return a;
    };
  }
  for (var i=0; i<collection.length; i++) {
    total += accessor(collection[i]);
  }
  return total;
};

export var transformIndex = function(idx, map) {
  // transform idx using map
  // everything is 0-indexed
  var result;
  if (idx >= map.length) {
    result = map[map.length - 1];
  } else {
    result = map[idx];
  }
  return result;
};


export var checkRange = function(range, len) {
  var start = range[0];
  var stop = range[1];
  if (start < 0) {
    throw "invalid start position";
  }
  if (stop > len) {
    throw "invalid stop position";
  }
  if (start >= stop) {
    throw "invalid range";
  }
};

export var checkRanges = function(ranges, len) {
  for (var i=0; i<ranges.length; i++) {
    checkRange(ranges[i], len);
  }
};


export var oneIndex = function(i) {
  if (i < 0) {
    throw "invalid index";
  }
  return i + 1;
};

export var zeroIndex = function(i) {
  if (i < 1) {
    throw "invalid index";
  }
  return i - 1;
};
