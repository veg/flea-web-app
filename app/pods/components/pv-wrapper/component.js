import Ember from 'ember';
import WidthHeightMixin from 'flea-app/mixins/width-height-mixin'

export default Ember.Component.extend(WidthHeightMixin, {
  // options
  shouldLabelCoordinates: false,

  // renderMode
  renderMode: 'tube',
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

  viewModel: Ember.observer('viewer', 'structure', function() {
    let viewer = this.get('viewer');
    if (!viewer) {
      return;
    }
    viewer.rm('*');
    let structure = this.get('structure');
    viewer.fitTo(structure);
    let geometry = viewer.renderAs('protein', structure, this.get('renderMode'), this.get('renderOptions'));
    this.set('geometry', geometry);
    this.updateColors();
    this.labelCoordinates();
    this.drawSelected();
  }),

  updateColors: function() {
    Ember.run.once(this, '_updateColors');
  }.observes('data.[]', 'range.[]', 'structure', 'geometry'),

  _updateColors() {
    let geometry = this.get('geometry');
    let structure = this.get('structure');
    if (structure === null) {
      return;
    }
    let data = this.get('data');
    let minval = 0;
    let maxval = 0;
    let gradient = pv.color.gradient(['white', 'darkred']);
    if (data) {
      // remap to [0, 1], since pv's stops seems broken
      let range = this.get('range');
      minval = d3.min(data);
      maxval = d3.max(data);
      if (range[0] > minval) {
        throw {name: 'RangeError', message: 'range[0] too large'};
      }
      if (range[1] < maxval) {
        throw {name: 'RangeError', message: 'range[1] too small'};
      }
      if (range[0] < 0) {
        // TODO: get gradient stops working, so this is unnecessary
        // map [range[0], 0] to [0, 0.5]
        // map [0, range[1]] to [0, 0.5]
        gradient = pv.color.gradient(['darkblue', 'white', 'darkred']);
      }
      data = _.map(data, d => (d - range[0]) / (range[1] - range[0]));

      structure.eachResidue(function(res) {
        let ref_coord = res.num();
        let val = data[ref_coord];
        val = (val === undefined ? 0 : val);
        res.customData = function() {return val;};
      });
      let newrange = [0, 1];
      let colorOp = pv.color.byResidueProp('customData', gradient, newrange);
      geometry.colorBy(colorOp);
      this.get('viewer').requestRedraw();
    }
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
        fontSize: 10,
        fontColor: "rgba(0, 0, 1, 0.9)"
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

  drawSelected: Ember.observer('viewer', 'structure', 'selectedPositions.[]', function() {
    Ember.run.once(this, '_drawSelected');
  }),

  _drawSelected() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    let positions = this.get('selectedPositions');

    if (!viewer || !structure || !positions) {
      return;
    }
    console.log(positions)
    viewer.rm('selectedPositions');
    let cm = viewer.customMesh('selectedPositions');
    structure.eachResidue(function(res) {
      let ref_coord = res.num();
      if (selectedPositions.contians(ref_coord)) {
	let coords = res.atom(0).pos();
	// TODO: color by data
	cm.addSphere(coords, 2, { color : 'yellow' });
      }
    });
  }
});
