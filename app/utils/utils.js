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
