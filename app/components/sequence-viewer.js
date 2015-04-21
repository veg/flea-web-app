import Ember from 'ember';
import {oneIndex} from '../utils/utils';

export default Ember.Component.extend({

  // bound to controller
  groupedSequences: {},
  alnToRef: null,
  selectedPositions: new Ember.Set(),

  selectDefault: false,

  didInsertElement: function() {
    if (this.get('selectDefault') && (this.get('selectedPositions.length') === 0)) {
      this.selectAllPositive();
    }
  },

  refHTML: function() {
    var result = [];
    var last_hs = -5;
    var map = this.get('alnToRef');
    var positive_positions = this.get('positiveSelection')[0];
    // TODO: there is surely a more elegent way of building this html
    var ranges = this.get('alnRanges');
    for (let i=0; i<ranges.length; i++) {
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
        var _class = 'hxb2_coord';
        if (this.get('selectedPositions').contains(s)) {
          _class += ' selected_position';
        }
        str = str.split('').join("<br/>");
        if (this.get('markPositive')) {
          str += '<br/>';
          str += (positive_positions.indexOf(s) >=0) ? "+" : "";
        }

        result.push({_class: _class,
                     dataCoord: s,
                     html: str});
        last_hs = hs;
      }
      if (ranges.length > 1 && i < ranges.length - 1) {
        result.push({_class: 'hxb2_coord seperator',
                     dataCoord: '',
                     html: '|<br/>|<br/>|'});
      }
    }
    return result;
  }.property('alnRanges', 'alnToRef', 'markPositive', 'positiveSelection',
             'selectedPositions', 'selectedPositions.[]'),

  selectAllPositive: function () {
    var positions = this.get('positiveSelection')[0];
    var ranges = this.get('alnRanges');
    var result = new Ember.Set();
    for (let r=0; r<ranges.length; r++) {
      var start = ranges[r][0];
      var stop = ranges[r][1];
      for (let i = 0; i < positions.length; i++) {
        // could do binary search to speed this up
        var pos = positions[i];
        if (start <= pos && pos <= stop) {
          result.add(pos);
        }
        if (pos > stop) {
          break;
        }
      }
    }
    this.set('selectedPositions', result);
  },

  actions: {
    togglePosition: function(pos) {
      pos = +pos;
      if (this.get('selectedPositions').contains(pos)) {
        this.get('selectedPositions').remove(pos);
      } else {
        this.get('selectedPositions').add(pos);
      }
    },
    clearPositions: function() {
      this.get('selectedPositions').clear();
    },
    selectPositiveClicked: function() {
      this.selectAllPositive();
    }
  }
});
