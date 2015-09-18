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
  radialLayout: false,

  minRadius: 1,
  maxRadius: 10,

  nodeSpan: function() {
    var idToCn = this.get('copynumbers');
    var max = d3.max(_.values(idToCn));
    var scale = d3.scale.sqrt()
        .domain([0, max])
        .range([this.get('minRadius'), this.get('maxRadius')]);
    return node => (node.name in idToCn) ? scale(idToCn[node.name]) : scale(1);
  }.property('copynumbers', 'minRadius', 'maxRadius'),

  nodeNamer: function() {
    var map = this.get('seqIdToNodeName');
    return function(data) {
      return (map[data.name] || data.name);
    };
  }.property('seqIdToNodeName'),

  nodeColorizer: function() {
    var map = this.get('seqIdToNodeColor');
    return function(element, data) {
      element.style("fill", map[data.name]);
    };
  }.property('seqIdToNodeColor'),

  didInsertElement: function() {
    var svg = d3.select('#' + this.get('elementId'));
    var tree_widget = d3.layout.phylotree()
        .svg(svg)
        .size([this.get('height'), this.get('width')])
        .separation(() => 0)
        .style_nodes (this.get('nodeColorizer'))
        .branch_name (this.get('nodeNamer'));

    tree_widget.node_span ('equal');
    tree_widget.options ({'is-radial' : this.get('radialLayout')}, false);

    if (this.get('do_copy_number')) {
      tree_widget.node_span (this.get('nodeSpan'));
      tree_widget.options ({'draw-size-bubbles' : true}, false);
      tree_widget.options ({'shift-nodes' : true}, false);
    } else {
      tree_widget.options ({'draw-size-bubbles' : false}, false);
      tree_widget.options ({'shift-nodes' : false}, false);
    }
    tree_widget.options ({'selectable' : false}, false);

    this.set('treeWidget', tree_widget);
    Ember.run.once(this, 'newTree');
  },

  newTree: function() {
    // do not call layout(), since it will be done in sort()
    this.get('treeWidget')(this.get('tree'));
    this.sort();
  }.observes('tree'),

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
    widget.update();
  }.observes('nodeNamer'),

  updateColors: function() {
    var widget = this.get('treeWidget');
    widget.style_nodes (this.get('nodeColorizer'));
    widget.refresh();
  }.observes('nodeColorizer'),

  updateLayout: function() {
    var widget = this.get('treeWidget');
    var radial = this.get('radialLayout');
    widget.options ({'is-radial' : radial}, false);
    widget.options ({'draw-size-bubbles' : !radial}, false);
    widget.options ({'shift-nodes' : !radial}, false);
    widget.placenodes();
    widget.update(true);
  }.observes('radialLayout')

});
