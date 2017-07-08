import Ember from 'ember';
import {oneIndex} from 'flea-app/utils/utils';

export default Ember.Component.extend({

  // bound to controller
  groupedSequences: {},
  alnToRef: null,
  selectedPositions: [],

  selectDefault: false,

  refHTML: function() {
    var result = [];
    var map = this.get('alnToRef');
    // TODO: there is surely a more elegent way of building this html
    var ranges = this.get('alnRanges');
    for (let i=0; i<ranges.length; i++) {
      var last_hs = -1;
      var start = ranges[i][0];
      var stop = ranges[i][1];
      for (let s=start; s < stop; s++) {
        var hs = oneIndex(map[s]);
        var str = "";
        if (hs < 10) {
          str = "  " + hs;
        } else if (hs < 100) {
          str = " " + hs;
        } else {
          str = "" + hs;
        }
        if (last_hs === hs) {
          str = " - ";
        }
        var _class = 'seq-cell ref-coords col';
        if (this.get('selectedPositions').contains(s)) {
          _class += ' selected_position';
        }
        str = str.split('').join("<br/>");
        str += '<br/>';

        result.push({_class: _class,
                     dataCoord: s,
                     html: str});
        last_hs = hs;
      }
      if (ranges.length > 1 && i < ranges.length - 1) {
        result.push({_class: 'ref_coord seperator',
                     dataCoord: '',
                     html: '|<br/>|<br/>|'});
      }
    }
    return result;
  }.property('alnRanges', 'alnToRef', 'markPositive', 'positiveSelection',
             'selectedPositions', 'selectedPositions.[]'),

  visiblePositiveSites: function() {
    var all_positions = this.get('positiveSelection');
    var ranges = this.get('alnRanges');
    var all_results = [];
    for (let k=0; k<all_positions.length; k++) {
      var result = [];
      var positions = all_positions[k];
      for (let r=0; r<ranges.length; r++) {
        var start = ranges[r][0];
        var stop = ranges[r][1];
        for (let i = 0; i < positions.length; i++) {
          // could do binary search to speed this up
          var pos = positions[i];
          if (start <= pos && pos <= stop) {
            result.push(pos);
          }
          if (pos > stop) {
            break;
          }
        }
      }
      all_results.push(result);
    }
    return all_results;
  }.property('positiveSelection.[]', 'alnRanges.[]'),

  allSelectionStrings: function() {
    var arrs = this.get('visiblePositiveSites');
    var ranges = this.get('alnRanges');
    var all_indices = _.flatten(ranges.map(r => _.range(r[0], r[1])));
    return arrs.map(arr => all_indices.map(idx => (arr.indexOf(idx) >=0) ? "<td class = 'seq-cell'>+</td>" : "<td class = 'seq-cell'></td>").join(''));
  }.property('visiblePositiveSites.[]', 'alnRanges.[]'),

  combinedSelectionString: function() {
    return this.get('allSelectionStrings')[0];
  }.property('allSelectionStrings.[]'),

  individualSelectionStrings: function() {
    var a = this.get('allSelectionStrings');
    var result = a.slice(1, a.length);
    return result;
  }.property('allSelectionStrings.[]'),

  groupedAndSelected: function() {
    var groups = this.get('groupedSequences');
    var sel = this.get('individualSelectionStrings');
    return _.range(0, groups.length).map(i => ({ 'group': groups[i], 'pos': sel[i] }));
  }.property('groupedSequences.[]', 'individualSelectionStrings.[]'),

  selectAllPositive: function () {
    var visibleCombined = this.get('visiblePositiveSites')[0];
    this.sendSelected(visibleCombined);
  },

  sendSelected: function(positions) {
    this.sendAction('setSelectedPositions', positions);
  },

  actions: {
    togglePosition: function(pos) {
      pos = +pos;
      var selected = this.get('selectedPositions');
      var index = selected.indexOf(pos);
      if (index > -1) {
        selected.splice(index, 1);
      } else {
        selected.push(pos);
      }
      // need copy to trigger update
      this.sendSelected(selected.slice());
    },

    clearPositions: function() {
      this.sendSelected([]);
    },

    selectPositiveClicked: function() {
      this.selectAllPositive();
    }
  }
});