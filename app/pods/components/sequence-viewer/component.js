import Ember from 'ember';

import { computed, action } from 'ember-decorators/object';
import { PropTypes } from 'ember-prop-types';

import {oneIndex} from 'flea-app/utils/utils';

export default Ember.Component.extend({

   propTypes: {
     groupedSequences: PropTypes.EmberObject.isRequired,
     alnToRef: PropTypes.EmberObject.isRequired,

     selectedPositions: PropTypes.EmberObject,

     // for setting colspan of divider rows
     // TODO: update this dynamically
     nCols: PropTypes.number
   },

  getDefaultProps() {
    return {
      selectedPositions: [],
      nCols: 1000
    };
  },

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

  @computed('positiveSelection', 'alnRanges.[]')
  visiblePositiveSites(positiveSelection, ranges) {
    let inRangeFunc = range => (i => range[0] <= i && i < range[1])
    let isVisible = R.anyPass(R.map(inRangeFunc, ranges));
    // use R.values() instead of R.prop() if you want all positive
    // sites from all time points
    let sites = R.compose(R.uniq, R.flatten, R.prop('Combined'))(positiveSelection);
    return R.filter(isVisible, sites);
  },

  sendSelected(positions) {
    // RESUME HERE: getting buttons to select/delete selection
    // of positive selection sites
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
    let visibleCombined = this.get('visiblePositiveSites');
    this.sendSelected(visibleCombined);
  }

});
