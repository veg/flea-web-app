import Ember from 'ember';

export default Ember.Component.extend({

  // bound to controller
  groupedSequences: {},
  refCoords: null,
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
    var ref_map = this.get('refCoords');
    var positive_positions = this.get('positiveSelection')[0];
    // TODO: there is surely a more elegent way of building this html
    for (var s = this.get('alnStart'); s <= this.get('alnStop'); s++) {
      var hs = ref_map[s - 1] + 1;
      var str = "";
      if (hs < 10) {
        str = "  " + hs;
      } else if (hs < 100) {
        str = " " + hs;
      } else {
        str = "" + hs;
      }
      if (last_hs === hs) {
        str = "INS";
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
    return result;
  }.property('alnStart', 'alnStop', 'refCoords', 'markPositive', 'positiveSelection',
             'selectedPositions', 'selectedPositions.[]'),

  selectAllPositive: function () {
    var positions = this.get('positiveSelection')[0];
    var start = this.get('alnStart');
    var stop = this.get('alnStop');
    var result = new Ember.Set();
    for (var i = 0; i < positions.length; i++) {
      // could do binary search to speed this up
      var pos = positions[i];
      if (start <= pos && pos <= stop) {
        result.add(pos);
      }
      if (pos > stop) {
        break;
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
