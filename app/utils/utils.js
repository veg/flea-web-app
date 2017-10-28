let getType = function (elem) {
  return Object.prototype.toString.call(elem).slice(8, -1);
};

export let isDate = function (elem) {
  return getType(elem) === 'Object';
};

export let isString = function (elem) {
  return getType(elem) === 'String';
};

export let parse_date = d3.time.format("%Y%m%d").parse;

export let format_date = d3.time.format("%B %Y");

export let htmlTable1D = function(data, header) {
  return htmlTable(data.map(elt => [elt]), header);
};

export let htmlTable = function(data, header) {
  if (data.length === 0) {
    return "<table></table>";
  }
  let result = '<table class="table-striped table table-hover">';
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

export let regexRanges = function(regex, string) {
  let indices = [];
  if (!regex) {
    return indices;
  }
  let result;
  let r = new RegExp(regex, 'g');
  while ((result = r.exec(string)) !== null) {
    indices.push([result.index, result.index + result[0].length-1]);
  }
  return indices;
};

export let sumArray = function(collection, accessor) {
  let total = 0;
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

export let transformIndex = function(idx, map, open) {
  // transform idx using map
  // everything is 0-indexed
  // if `open`, this is an open interval
  let result;
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

export let checkRange = function(range, targetRange) {
  // ensure range [a, b) falls inside [c, d).
  let [start, stop] = range;
  let [tstart, tstop] = targetRange;
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

export let checkRanges = function(ranges, targetRange) {
  for (let i=0; i<ranges.length; i++) {
    checkRange(ranges[i], targetRange);
  }
};

export let oneIndex = function(i) {
  if (i < 0) {
    throw "invalid index";
  }
  return i + 1;
};

export let zeroIndex = function(i) {
  if (i < 1) {
    throw "invalid index";
  }
  return i - 1;
};

export let alignmentTicks = function(a2r, r2a, tick) {
  // generate reference index tick locations closest to
  // every `tick` possible, including first and last.

  let first = a2r[0];
  let last = a2r[a2r.length - 1];

  // 1-indexed reference ticks we want
  let wanted = R.map(R.multiply(tick), R.range(Math.ceil(first / tick),
					       1 + Math.floor(last / tick)));

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

export let refToAlnCoords = function(alnToRef, stop) {
  let toFirst = new Array(stop);
  let toLast = new Array(stop);
  let last_ref_index = -1;
  for (let aln_index=0; aln_index<alnToRef.length; aln_index++) {
    let ref_index = alnToRef[aln_index];
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

export let mapIfPresent = function(map, key) {
  if (key in map) {
    return map[key];
  }
  return key;
};

export let insertNested = function(map, keys, val) {
  for (let i=0; i<keys.length - 1; i++) {
    let key = keys[i];
    if (!(key in map)) {
      map[key] = {};
    }
    map = map[key];
  }
  map[keys[keys.length - 1]] = val;
};

export let seqIdToProperty = function(seqs, property) {
  if (!seqs) {
    return {};
  }
  return R.zipObj(R.map(R.prop('id'), seqs), R.map(R.prop(property), seqs));
};
