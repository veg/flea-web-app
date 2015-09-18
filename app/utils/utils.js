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


export var alignmentTicks = function(a2r, r2a, tick) {
  // generate reference index tick locations closest to
  // every `tick` possible, including first and last.

  var first = a2r[0];
  var last = a2r[a2r.length - 1];

  // 1-indexed reference ticks we want
  var wanted = _.range(Math.ceil(first / tick) * tick, 1 + Math.floor(last / tick) * tick, tick);

  // need to remove 0 if it is present; will add later if necessary
  if (wanted[0] === 0) {
    wanted[0] = 1;
  }

  // convert to 0-indexing and add first and last positions
  wanted = wanted.map(v => zeroIndex(v));
  if (wanted[0] !== first) {
    wanted.unshift(first);
  }
  if (wanted[wanted.length - 1] !== last) {
    wanted.push(last);
  }

  // transform to closest possible alignment indices
  return wanted.map(t => r2a[t]);
};


export var refToAlnCoords = function(alnToRef, stop) {
  var toFirst = new Array(stop);
  var toLast = new Array(stop);
  var last_ref_index = -1;
  for (let aln_index=0; aln_index<alnToRef.length; aln_index++) {
    var ref_index = alnToRef[aln_index];
    toLast[ref_index] = aln_index;
    if (ref_index !== last_ref_index) {
      toFirst[ref_index] = aln_index;
    }
    // fill in missing values
    if (last_ref_index > -1) {
      for (let missing_ref_index=last_ref_index + 1; missing_ref_index < ref_index; missing_ref_index++) {
        toFirst[missing_ref_index] = aln_index;
        toLast[missing_ref_index] = aln_index - 1;
      }
    }
    last_ref_index = ref_index;
  }
  return [toFirst, toLast];
};


export var mapIfPresent = function(map, key) {
  if (key in map) {
    return map[key];
  }
  return key;
};

export var insertNested = function(map, keys, val) {
  for (let i=0; i<keys.length - 1; i++) {
    var key = keys[i];
    if (!(key in map)) {
      map[key] = {};
    }
    map = map[key];
  }
  map[keys[keys.length - 1]] = val;
}
