import Ember from 'ember';
import {oneIndex} from 'flea-app/utils/utils';

export default Ember.Component.extend({

  // just for setting colspan of divider rows
  // TODO: update this dynamically
  nCols: 1000,

  // bound to controller
  groupedSequences: {},
  alnToRef: null,
  selectedPositions: [],

  selectDefault: false,

 didInsertElement: function() {
   // make fixed header work
   // see https://stackoverflow.com/a/25902860
   this._super(...arguments);
   this.$('#wrapped-table').on('scroll', function() {
     var translate = "translate(0,"+this.scrollTop+"px)";
     this.querySelector("thead").style.transform = translate;
   });
 },

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
        var _class = 'ref_coord';
        if (this.get('selectedPositions').includes(s)) {
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
  }.property('alnRanges', 'alnToRef',
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
