import Ember from 'ember';

export default Ember.Component.extend({
  // options
  shouldLabel: true,
  fog: true,
  spin: false,
  slabModes: ['auto', 'fixed'],
  slabMode: 'auto',
  slabNear: 0.1,
  slabFar: 400.0,  // FIXME: compute this dynamically

  // bound
  structure: null,
  data: [],
  range: [0, 1],

  // created
  viewer: null,
  geometry: null,

  updateSpin: function() {
    this.get('viewer').spin(this.get('spin'));
  }.observes('spin'),

  updateFog: function() {
    this.get('viewer').options('fog', this.get('fog'));
    this.get('viewer').requestRedraw();
  }.observes('fog'),

  updateSlabMode: function() {
    Ember.run.once(this, '_updateSlabMode');
  }.observes('slabMode', 'slabNear', 'slabFar'),

  _updateSlabMode: function() {
    this.get('viewer').slabMode(this.get('slabMode'),
                                {near: +this.get('slabNear'),
                                 far: +this.get('slabFar')});
    this.get('viewer').requestRedraw();
  },

  showSlabControls: function() {
    return this.get('slabMode') === 'fixed';
  }.property('slabMode'),

  didInsertElement: function () {
    var options = {
      width: 1000,
      height: 800,
      antialias: true,
      quality : 'medium'
    };
    var viewer = pv.Viewer(this.$()[0], options);
    this.set('viewer', viewer);
    var structure = this.get('structure');
    viewer.fitTo(structure);
    var geometry = viewer.cartoon('protein', structure);
    geometry.colorBy(pv.color.uniform('blue'));
    this.set('geometry', geometry);
    this.updateColors();
    this.labelResidues();
  },

  updateColors: function() {
    Ember.run.once(this, '_updateColors');
  }.observes('data.[]', 'range.[]', 'structure', 'geometry'),

  _updateColors() {
    var geometry = this.get('geometry');
    var structure = this.get('structure');
    if (structure === null) {
      return;
    }
    var data = this.get('data');
    var minval = 0;
    var maxval = 0;
    var gradient = pv.color.gradient(['white', 'darkred']);
    if (data) {
      // remap to [0, 1], since pv's stops seems broken
      var range = this.get('range');
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
        var ref_coord = res.num();
        var val = data[ref_coord];
        val = (val === undefined ? 0 : val);
        res.customData = function() {return val;};
      });
      var newrange = [0, 1];
      var colorOp = pv.color.byResidueProp('customData', gradient, newrange);
      geometry.colorBy(colorOp);
      this.get('viewer').requestRedraw();
    }
  },

  labelResidues: function() {
    var viewer = this.get('viewer');
    viewer.rm('label*');
    if (this.get('shouldLabel')) {
      var structure = this.get('structure');
      var uniq_res_id = 0;
      var label_options = {
        fontSize: 10,
        fontColor: "rgba(0, 0, 0, 0.5)"
      };
      structure.eachResidue(function(res) {
        var ref_coord = res.num();
        if (ref_coord % 10 === 0) {
          var id = 'label_' + uniq_res_id;
          viewer.label(id, ref_coord, res.atom(0).pos(), label_options);
          uniq_res_id += 1;
        }
      });
    }
    this.get('viewer').requestRedraw();
  }.observes('shouldLabel'),

  actions: {
    selectSlabMode: function(value) {
      if (value != null) {
        this.set('slabMode', value);
      }
    }
  }
});
