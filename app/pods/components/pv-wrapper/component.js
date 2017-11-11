import Ember from "ember";
import Component from '@ember/component';
import { next, once } from "@ember/runloop"

import { computed, observes } from 'ember-decorators/object';
import { PropTypes } from 'ember-prop-types';

import WidthHeightMixin from 'flea-app/mixins/width-height-mixin';
import Vector from 'flea-app/utils/vector';


function vectorMean(vecs) {
  let result = new Vector(0, 0, 0);
  R.forEach(v => Vector.add(v, result, result), vecs);
  return result.divide(vecs.length);
}


function residueCenter(aa) {
  let vecs = R.map(a => new Vector(...a.pos()), aa.atoms());
  return vectorMean(vecs);
}

function bezierCurve(p0, p1, p2, p3, t) {
  let c0 = p0.multiply(Math.pow(1-t, 3));
  let c1 = p1.multiply(3 * Math.pow(1 - t, 2) * t);
  let c2 = p2.multiply(3 * (1 - t) * Math.pow(t, 2));
  let c3 = p3.multiply(Math.pow(t, 3));
  return c0.add(c1).add(c2).add(c3);
}

function linearCurve(p0, p1, p2, p3, t) {
  return Vector.lerp(p0, p3, t);
}


export default Component.extend(WidthHeightMixin, {

  // The structure to render.
  // must be an instance of pv.Mol
  structure: null,

   propTypes: {
     data: PropTypes.EmberObject,
     range: PropTypes.EmberObject,
     selectedPositions: PropTypes.EmberObject,
     shouldLabelCoordinates: PropTypes.bool
   },

  getDefaultProps() {
    return {
      data: [],
      range: [0, 1],
      selectedPositions: [],
      shouldLabelCoordinates: false,
    };
  },

  viewer: null,
  geometry: null,
  hoveredResidue: null,

  @computed('hoveredResidue')
  hoveredLabel(res) {
    if (!res) {
      return "";
    }
    let name = res.name();
    let num = res.num();
    // TODO: also print region (like v1, mper, etc)
    return `${name} ${num}`;
  },

  didInsertElement: function () {
    this._super(...arguments);
    next(this, this.get('setupView'));
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

  @observes('viewer', 'structure', 'renderMode', 'renderOptions')
  updateView() {
    once(this, '_updateView')
  },

  @computed('selectedPositions.length')
  renderMode(n) {
    if (n > 0) {
      return 'tube';
    }
    return 'tube';
  },

  @computed('selectedPositions.length')
  renderOptions(n) {
    if (n > 0) {
      return {'radius': 0.2};
    }
    return {'radius': 1.5};
  },

  @computed('structure')
  centerOfMass(structure) {
    let result = new Vector(0, 0, 0);
    if (!structure) {
      return result;
    }
    let residues = R.flatten(R.map(c => c.residues(), structure.chains()));
    let vectors = R.map(r => residueCenter(r), residues);
    return vectorMean(vectors);
  },

  _updateView() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    let center = this.get('centerOfMass');
    if (!viewer || !structure) {
      return;
    }
    viewer.clear();
    viewer.fitTo(structure);
    let geometry = viewer.renderAs('protein', structure,
                                   this.get('renderMode'),
                                   this.get('renderOptions'));

    // draw missing residues
    let mesh = viewer.customMesh('missing');
    for (const chain of structure.chains()) {
      let residues = chain.residues();
      let nums = residues.map(r => r.num());
      let indices = R.filter(
        i => nums[i] + 1 < nums[i + 1],
        R.range(0, nums.length - 1)
      );
      for (const i of indices) {
	let prev = residueCenter(residues[i-1]);
        let vstart = residueCenter(residues[i]);
        let vstop = residueCenter(residues[i + 1]);
        let next = residueCenter(residues[i + 2]);
	let dist = vstop.subtract(vstart).length();

	prev = prev || vstart;
	next = next || vstop;

	let p0 = vstart;
	let p1 = vstart.add(vstart.subtract(prev).multiply(1.5));
	let p2 = vstop.add(vstop.subtract(next).multiply(1.5));
	let p3 = vstop;

        let n = nums[i + 1] - nums[i] - 1;
	let interpolate = (n < 5) ? linearCurve : bezierCurve;

        for (let j=0; j<n; j++) {
	  let t = (j+1) / (n+1);
	  let coord = interpolate(p0, p1, p2, p3, t).toArray();
          let gradient = pv.color.gradient(['yellow', 'green']);
          let color = [1, 1, 1, 1];
          gradient.colorAt(color, j/n);
          mesh.addSphere(coord, 2.0, {color: color});
        }
      }
    }

    this.set('geometry', geometry);
    this.labelCoordinates();
    this.updateColors();
    this.drawSelected();
  },

  // handle this browser event to highlight residue under the mouse
  mouseMove(event) {
    let viewer = this.get('viewer');
    if (!viewer) {
      return;
    }
    let rect = viewer.boundingClientRect();
    let picked = viewer.pick({ x : event.clientX - rect.left,
                               y : event.clientY - rect.top });
    if (picked === null || picked.target() === null) {
      this.set("hoveredResidue", null);
      return;
    }
    // don't to anything if the clicked structure does not have an atom.
    if (picked.node().structure === undefined) {
      this.set("hoveredResidue", null);
      return;
    }
    let atom = picked.target();
    this.set("hoveredResidue", atom.residue());
    let sel = picked.node().structure().createEmptyView();
    if (!sel.removeAtom(picked.target(), true)) {
      sel.addAtom(picked.target());
    }
    picked.node().setSelection(sel);
    viewer.requestRedraw();
  },

  @observes('renderMode', 'viewer', 'structure')
  updateRenderMode() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    viewer.clear();
    viewer.fitTo(structure);

    let geometry = viewer.renderAs('protein', structure, this.get('renderMode'), this.get('renderOptions'));
    this.set('geometry', geometry);
  },

  @observes('data.[]', 'range.[]', 'structure', 'geometry', 'gradient')
  updateColors() {
    once(this, '_updateColors');
  },

  @computed('range')
  gradient(range) {
    let gradient = pv.color.gradient(['white', 'darkred']);
    if (range[0] < 0) {
      // TODO: get gradient stops working, so this is unnecessary
      // map [range[0], 0] to [0, 0.5]
      // map [0, range[1]] to [0, 0.5]
      gradient = pv.color.gradient(['darkblue', 'white', 'darkred']);
    }
    return gradient;
  },

  // remap to [0, 1], since pv's stops seems broken
  @computed('data.[]', 'range.[]')
  normalizedData(data, range) {
    if (!data) {
      return null;
    }
    let minval = d3.min(data);
    let maxval = d3.max(data);
    if (range[0] > minval) {
      throw {name: 'RangeError', message: 'range[0] too large'};
    }
    if (range[1] < maxval) {
      throw {name: 'RangeError', message: 'range[1] too small'};
    }
    return R.map(d => (d - range[0]) / (range[1] - range[0]),
                 data);
  },

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
      let ref_num = res.num();
      // subtract 1 because ref_num is 1-indexed.
      let val = data[ref_num - 1];
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

  @observes('shouldLabelCoordinates')
  labelCoordinates() {
    once(this, '_labelCoordinates');
  },

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

  @observes('viewer', 'structure', 'gradient',
            'normalizedData.[]',
            'selectedPositions.[]')
  drawSelected() {
    // ensure colors are available as res.customData() before trying
    // to color spheres
    once(this, '_drawSelected');
  },

  _drawSelected() {
    let viewer = this.get('viewer');
    let structure = this.get('structure');
    let positions = this.get('selectedPositions');
    let gradient = this.get('gradient');

    let data = this.get('normalizedData');

    if (!viewer || !structure || !gradient || !positions || !data) {
      return;
    }
    viewer.rm('selectedPositions');
    let cm = viewer.customMesh('selectedPositions');
    structure.eachResidue(function(res) {
      let ref_num = res.num();
      // positions are 0-indexed, and reference numbers are 1-indexed.
      // need to make them comparable
      if (positions.includes(ref_num - 1)) {
        let coord = res.atom(0).pos();
        let color = [1, 1, 1, 1];
        let val = data[ref_num - 1];
        val = (val === undefined ? 0 : val);
        gradient.colorAt(color, val);
        cm.addSphere(coord, 2, { 'color' : color });
      }
    });
  }
});
