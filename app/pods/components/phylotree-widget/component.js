import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],

  treeWidget: null,

  // TODO: make these parameters
  width:  800,
  height: 600,

  tree: null,
  copynumbers: null,
  do_copy_number: false,

  // parameters
  seqIdToNodeName: null,
  seqIdToNodeColor: null,

  nodeNamer: function() {
    var map = this.get('seqIdToNodeName');
    return function(data) {
      return (map[data.name] || "");
    };
  }.property('seqIdToNodeName'),

  nodeColorizer: function() {
    var map = this.get('seqIdToNodeColor');
    return function(element, data) {
      element.style("fill", map[data.name]);
    };
  }.property('seqIdToNodeColor'),

  didInsertElement: function() {
    var tree_widget = d3.layout.phylotree("body")
        .size([this.get('height'), this.get('width')])
        .separation(() => 0)
        .style_nodes (this.get('nodeColorizer'))
        .branch_name (this.get('nodeNamer'));

    tree_widget.node_span ('equal');

    if (this.get('do_copy_number')) {
      var copynumbers = this.get('copynumbers');
      tree_widget.node_span (function (a) {
        if (copynumbers.hasOwnProperty(a.name)) {
          return Math.sqrt(copynumbers[a.name]);
        }
        return 1;
      });
      tree_widget.options ({'draw-size-bubbles' : true}, false);
      tree_widget.options ({'min-bubble-size' : 0.1}, false);
      tree_widget.options ({'max-bubble-size' : 3}, false);
      tree_widget.update_scale();
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
    this.sort();
  }.observes('tree', 'treeWidget'),

  sort: function() {
    var sort_state = this.get('sortState');
    if (sort_state === "ascending") {
      this.sortNodes(true);
    } else if (sort_state === "descending") {
      this.sortNodes(false);
    } else {
      this.sortOriginal();
    }
  }.observes('sortState'),

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

  space: function() {
    var space_state = this.get('spaceState');
    if (space_state === "neutral") {
      return;
    }
    else if (space_state === "compress") {
      this.compressSpacing();
    } else if (space_state === "expand") {
      this.expandSpacing();
    }
    this.set("spaceState", "neutral");
  }.observes('spaceState'),

  expandSpacing: function() {
    var widget = this.get('treeWidget');
    widget.spacing_x(widget.spacing_x() + 1).update(true);
  },

  compressSpacing: function() {
    var widget = this.get('treeWidget');
    widget.spacing_x(widget.spacing_x() - 1).update(true);
  },

  updateNames: function() {
    var widget = this.get('treeWidget');
    widget.branch_name(this.get('nodeNamer'));
    widget.update(true);
  }.observes('nodeNamer'),

  updateColors: function() {
    var widget = this.get('treeWidget');
    widget.style_nodes (this.get('nodeColorizer'));
    widget.update(true);
  }.observes('nodeColorizer'),

});
