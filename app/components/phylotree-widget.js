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
    //this.map_evolution_onto_tree();  // TODO
  },

  update: function() {
    var tree = this.get('tree');
    var svg = d3.select('#' + this.get('elementId'));
    var tree_widget = this.get('treeWidget');
    tree_widget(tree).svg(svg).layout();
    this.sortNodes(true);
  }.observes('tree', 'treeWidget'),

  sortNodes: function(ascending) {
    var widget = this.get('treeWidget');
    widget.traverse_and_compute (function (n) {
      var d = 1;
      if (n.children && n.children.length) {
        d += d3.max (n.children, function (d) { return d["count_depth"];});
      }
      n["count_depth"] = d;
    });
    widget.resort_children (function (a,b) {
      return (a["count_depth"] - b["count_depth"]) * (ascending ? 1 : -1);
    });
  },

  sortOriginal: function() {
    this.get('treeWidget').resort_children (function (a,b) {
      return a["original_child_order"] - b["original_child_order"];
    });
  },

  expandSpacing: function() {
    var widget = this.get('treeWidget');
    widget.spacing_x(widget.spacing_x() + 1).update(true);
  },

  compressSpacing: function() {
    var widget = this.get('treeWidget');
    widget.spacing_x(widget.spacing_x() - 1).update(true);
  }
});
