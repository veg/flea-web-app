import Component from '@ember/component';
import { computed } from '@ember/object';
import WidthHeightMixin from 'flea-app/mixins/width-height-mixin'

export default Component.extend(WidthHeightMixin, {
  // options
  shouldLabelCoordinates: false,

  renderOptions: {'radius': 1.5},

  // where to draw spheres
  selectedPositions: null,

  // bound
  structure: null,
  data: [],
  range: [0, 1],

  // created
  viewer: null,
  geometry: null,

  didInsertElement: function () {
    this._super(...arguments);

    // Ember.run.scheduleOnce('afterRender', setSize);
    Ember.run.next(this, this.get('setupView'));
  },

  doResize() {
    this._super(...arguments);
    let viewer = this.get('viewer');
    if (!viewer) {
      return;
    }
    viewer.resize(this.get('width'), this.get('height'));
  },

  setupView() {
    let options = {
      width: this.get('width'),
      height: this.get('height'),
      antialias: true,
      quality : 'medium',
      fog: true,
      background: 'black'
    };
    let viewer = pv.Viewer(this.$()[0], options);
    this.set('viewer', viewer);
  },

  updateView: function() {
    this._updateView()
  }.observes('viewer', 'structure', 'renderMode'),

  renderMode: computed('selectedPositions.length', function() {
    let n = this.get('selectedPositions.length');
    if (n > 0) {
      return 'sline';
    }
    return 'tube';
  }),

  _updateView() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    if (!viewer || !structure) {
      return;
    }
    viewer.clear();
    viewer.fitTo(structure);
    let geometry = viewer.renderAs('protein', structure, this.get('renderMode'), this.get('renderOptions'));
    this.set('geometry', geometry);
    this.labelCoordinates();
    this.updateColors();
    this.drawSelected();
  },

  updateRenderMode: function() {
    let viewer = this.get('viewer');
    viewer.clear();
    let structure = this.get('structure');
    viewer.fitTo(structure);

    let geometry = viewer.renderAs('protein', structure, this.get('renderMode'), this.get('renderOptions'));
    viewer.cartoon('structure', structure, { color: pv.color.ssSuccession() });
  }.observes('renderMode', 'viewer', 'structure'),

  updateColors: function() {
    Ember.run.once(this, '_updateColors');
  }.observes('data.[]', 'range.[]', 'structure', 'geometry', 'gradient'),

  gradient: computed('range', function() {
    let range = this.get('range');
    let gradient = pv.color.gradient(['white', 'darkred']);
    if (range[0] < 0) {
      // TODO: get gradient stops working, so this is unnecessary
      // map [range[0], 0] to [0, 0.5]
      // map [0, range[1]] to [0, 0.5]
      gradient = pv.color.gradient(['darkblue', 'white', 'darkred']);
    }
    return gradient;
  }),

  // remap to [0, 1], since pv's stops seems broken
  normalizedData: computed('data.[]', 'range.[]', function() {
    let data = this.get('data');
    let range = this.get('range');
    let minval = d3.min(data);
    let maxval = d3.max(data);
    if (range[0] > minval) {
      throw {name: 'RangeError', message: 'range[0] too large'};
    }
    if (range[1] < maxval) {
      throw {name: 'RangeError', message: 'range[1] too small'};
    }
    return _.map(data, d => (d - range[0]) / (range[1] - range[0]));
  }),

  _updateColors() {
    let geometry = this.get('geometry');
    let structure = this.get('structure');
    if (structure === null) {
      return;
    }
    let data = this.get('normalizedData');
    if (!data) {
      return;
    }
    structure.eachResidue(function(res) {
      let ref_coord = res.num();
      let val = data[ref_coord];
      val = (val === undefined ? 0 : val);
      res.customData = function() {return val;};
    });
    let newrange = [0, 1];
    let gradient = this.get('gradient');
    let colorOp = pv.color.byResidueProp('customData', gradient, newrange);
    geometry.colorBy(colorOp);
    this.drawSelected();
    this.get('viewer').requestRedraw();
  },

  labelCoordinates: function() {
    Ember.run.once(this, '_labelCoordinates');
  }.observes('shouldLabelCoordinates'),

  _labelCoordinates() {
    let viewer = this.get('viewer');
    viewer.rm('label*');
    if (this.get('shouldLabelCoordinates')) {
      let structure = this.get('structure');
      let uniq_res_id = 0;
      let label_options = {
        fontSize: 12,
        fontColor: 'yellow',
        backgroundColor: 'black',
        backgroundAlpha: 0.9,
      };
      structure.eachResidue(function(res) {
        let ref_coord = res.num();
        if (ref_coord % 10 === 0) {
          let id = 'label_' + uniq_res_id;
          viewer.label(id, ref_coord, res.atom(0).pos(), label_options);
          uniq_res_id += 1;
        }
      });
    }
    this.get('viewer').requestRedraw();
  },

  drawSelected: Ember.observer('viewer', 'structure', 'gradient', 'selectedPositions.[]', function() {
    Ember.run.once(this, '_drawSelected');
  }),

  _drawSelected() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    let positions = this.get('selectedPositions');
    let gradient = this.get('gradient');

    if (!viewer || !structure || !gradient || !positions) {
      return;
    }
    viewer.rm('selectedPositions');
    let cm = viewer.customMesh('selectedPositions');
    let newrange = [0, 1];
    structure.eachResidue(function(res) {
      let ref_coord = res.num();
      if (positions.includes(ref_coord)) {
	let coords = res.atom(0).pos();
	let color = [1, 1, 1, 1];
	gradient.colorAt(color, res.customData());
	cm.addSphere(coords, 2, { 'color' : color });
      }
    });
  }
});
