import Ember from 'ember';
import {oneIndex} from 'flea-app/utils/utils';
import { computed, action } from 'ember-decorators/object';

export default Ember.Component.extend({

  // just for setting colspan of divider rows
  // TODO: update this dynamically
  nCols: 1000,

  // bound to controller
  groupedSequences: {},
  alnToRef: null,
  selectedPositions: [],

  selectDefault: false,

  didInsertElement() {
    // make fixed header work
    // see https://stackoverflow.com/a/25902860
    this._super(...arguments);
    this.$('#wrapped-table').on('scroll', function() {
      let translate = "translate(0,"+this.scrollTop+"px)";
      this.querySelector("thead").style.transform = translate;
    });
  },

  @computed('alnRanges', 'alnToRef', 'selectedPositions.[]')
  refHTML(ranges, map, selectedPositions) {
    let result = [];
    // TODO: there is surely a more elegent way of building this html
    for (let i=0; i<ranges.length; i++) {
      let last_hs = -1;
      let start = ranges[i][0];
      let stop = ranges[i][1];
      for (let s=start; s < stop; s++) {
        let hs = oneIndex(map[s]);
        let str = "";
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
        let _class = 'ref_coord';
        if (selectedPositions.includes(s)) {
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
  },

  @computed('positiveSelection.[]', 'alnRanges.[]')
  visiblePositiveSites(all_positions, ranges) {
    let all_results = [];
    for (let k=0; k<all_positions.length; k++) {
      let result = [];
      let positions = all_positions[k];
      for (let r=0; r<ranges.length; r++) {
        let start = ranges[r][0];
        let stop = ranges[r][1];
        for (let i = 0; i < positions.length; i++) {
          // could do binary search to speed this up
          let pos = positions[i];
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
  },

  selectAllPositive() {
    let visibleCombined = this.get('visiblePositiveSites')[0];
    this.sendSelected(visibleCombined);
  },

  sendSelected(positions) {
    this.sendAction('setSelectedPositions', positions);
  },

  @action
  togglePosition(pos) {
    pos = +pos;
    let selected = this.get('selectedPositions');
    let index = selected.indexOf(pos);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(pos);
    }
    // need copy to trigger update
    this.sendSelected(selected.slice());
  },

  @action
  clearPositions() {
    this.sendSelected([]);
  },

  @action
  selectPositiveClicked() {
    this.selectAllPositive();
  }

});
