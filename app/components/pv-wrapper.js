import Ember from 'ember';

export default Ember.Component.extend({
  // options
  shouldLabel: true,
  fog: true,
  // slabMode: 'auto',
  // slabNear: 1,
  // slabFar: 100,

  // bound
  structure: null,
  data: [],

  // created
  viewer: null,
  geometry: null,

  setOption: function(name, val) {
    this.get('viewer').options(name, val);
    this.get('viewer').requestRedraw();
  },

  updateFog: function() {
    this.setOption('fog', this.get('fog'));
  }.observes('fog'),



  didInsertElement: function () {
    var options = {
      width: 1000,
      height: 800,
      antialias: true,
      quality : 'medium'
    };
    var viewer = pv.Viewer(this.$()[0], options)
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
      minval = d3.min(data);
      maxval = d3.max(data);
      if (-minval === maxval) {
        // TODO: get gradient stops working, so this is unnecessary
        gradient = pv.color.gradient(['darkblue', 'white', 'darkred']);
      }
      var range = maxval - minval;
      data = _.map(data, function(d) {
        return (d - minval) / range;
      });
    }
    structure.eachResidue(function(res) {
      var ref_coord = res.num();
      var val = data[ref_coord];
      val = (val === undefined ? 0 : val);
      res.customData = function() {return val;};
    });
    var colorOp = pv.color.byResidueProp('customData', gradient);
    geometry.colorBy(colorOp);
    this.get('viewer').requestRedraw();
  }.observes('data.@each', 'structure', 'geometry'),

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
  }.observes('shouldLabel')
});
