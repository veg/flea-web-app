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
  return htmlTable(data.map(elt => [elt]), header);
};


export var htmlTable = function(data, header) {
  if (data.length === 0) {
    return "<table></table>";
  }
  var result = '<table class="table-striped table table-hover">';
  if (header) {
    result += '<thead>';
    result += '<trow>';
    for (let k=0; k<header.length; k++) {
      result += '<th>';
      result += header[k];
      result += '</th>';
    }
    result += '</trow>';
    result += '</thead>';
  }
  result += '<tbody>';
  for (let i=0; i<data.length; i++) {
    result += '<tr>';
    for (let j=0; j<data[i].length; j++) {
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
  for (let i=0; i<collection.length; i++) {
    total += accessor(collection[i]);
  }
  return total;
};

export var transformIndex = function(idx, map, open) {
  // transform idx using map
  // everything is 0-indexed
  // if `open`, this is an open interval
  var result;
  if (open) {
    idx -= 1;
  }
  if (idx >= map.length) {
    result = map[map.length - 1];
  } else {
    result = map[idx];
  }
  if (open) {
    result += 1;
  }
  return result;
};


export var checkRange = function(range, targetRange) {
  // ensure range [a, b) falls inside [c, d).
  var [start, stop] = range;
  var [tstart, tstop] = targetRange;
  if (start < tstart || start > tstop) {
    throw "invalid start position";
  }
  if (stop < tstart || stop > tstop) {
    throw "invalid stop position";
  }
  if (start >= stop) {
    throw "invalid range";
  }
};


export var checkRanges = function(ranges, targetRange) {
  for (let i=0; i<ranges.length; i++) {
    checkRange(ranges[i], targetRange);
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
