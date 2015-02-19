import Ember from 'ember';
import {parse_date, format_date, isString} from '../utils/utils';

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  treeWidget: null,

  // TODO: make these parameters
  width:  800,
  height: 600,

  tree: null,
  seq_ids_to_dates: null,

  do_copy_number: false,

  didInsertElement: function() {
    var seq_ids_to_dates = this.get('seq_ids_to_dates');

    var time_point_colors = d3.scale.category10();
    var tree_widget_node_colorizer = function(element, data) {
      element.style ("fill", time_point_colors (seq_ids_to_dates[data.name.toUpperCase()]));
    };

    var tree_widget_show_date = function(data) {
      return format_date(seq_ids_to_dates[data.name.toUpperCase()]);
    };

    var tree_widget = d3.layout.phylotree("body")
        .size([this.get('height'), this.get('width')])
        .separation (function (a,b) {return 0;})
        .style_nodes (tree_widget_node_colorizer)
        .branch_name (tree_widget_show_date);

    tree_widget.node_span ('equal');

    if (this.get('do_copy_number')) {
      var copy_re = /_([0-9]+)$/;
      tree_widget.node_span (function (a) {
        var m = copy_re.exec (a.name);
        try {
          var copynum = Math.sqrt(parseFloat (m[1]));
          return copynum;
        } catch (e) {}
        return null;});
      tree_widget.options ({'draw-size-bubbles' : true}, false);
    } else {
      tree_widget.options ({'draw-size-bubbles' : false}, false);
    }
    tree_widget.options ({'selectable' : false}, false);

    this.set('treeWidget', tree_widget);

    this.update();

    //map_evolution_onto_tree();

    // default to deepest nodes on top; since other selectors
    // trigger this one, this should always be true for a new
    // tree.
    //sort_nodes (true);
  },

  update: function() {
    var tree = this.get('tree');
    var svg = d3.select('#' + this.get('elementId'));
    var tree_widget = this.get('treeWidget');
    tree_widget(tree).svg(svg).layout();
  }.observes('tree', 'treeWidget')
});
