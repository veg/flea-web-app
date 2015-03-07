import Ember from 'ember';

export default Ember.Component.extend({
  didInsertElement: function () {
    var options = {
      width: 1000,
      height: 800,
      antialias: true,
      quality : 'medium'
    };
    var label_options = {
      fontSize: 10,
      fontColor: "rgba(0, 0, 0, 0.5)"
    };
    var viewer = pv.Viewer(this.$()[0], options);
    var structure = this.get('structure');
    var data = this.get('data');
    // remap to [0, 1], since pv's stops seems broken
    var minval = d3.min(data);
    var maxval = d3.max(data);
    if (-minval != maxval) {
      // TODO: get gradient stops working, so this is unnecessary
      throw "coloring only works if -minval == maxval";
    }
    var range = maxval - minval;
    data = _.map(data, function(d) {
      return (d - minval) / range;
    });
    structure.eachResidue(function(res) {
      var ref_coord = res.num();
      var val = data[ref_coord];
      if (val === undefined) {
        val = 0;
      }
      res.customData = function() {return val;};
      if (ref_coord % 10 === 0) {
        var id = 'ref coord';
        viewer.label(id, ref_coord, res.atom(0).pos(), label_options);
      }
    });

    var gradient = pv.color.gradient(['darkblue', 'white', 'darkred']);
    viewer.cartoon('protein', structure, { color : pv.color.byResidueProp('customData', gradient) });
    viewer.fitTo(structure);
  }.observes('structure', 'data')
});
