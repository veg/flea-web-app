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
  showCopynumber: false,
  overlapNodes: true,

  // parameters
  seqIdToNodeName: null,
  seqIdToNodeColor: null,
  seqIdToMotifColor: null,
  seqIdToMotif: null,
  radialLayout: false,

  minRadius: 0.1,
  maxRadius: 10,
  heightScale: 1.0,

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
      return (Ember.isPresent(map[data.name]) ? map[data.name] : "");
    };
  }.property('seqIdToNodeName'),

  nodeColorizer: function() {
    var nodeMap = this.get('seqIdToNodeColor');
    var textMap = this.get('seqIdToMotifColor');
    return (element, node) => {
      if (Ember.isPresent(nodeMap)) {
        element.selectAll('circle').style("fill", nodeMap[node.name]).style('opacity', 0.4);
      } else {
        element.selectAll('circle').style("fill", 'LightGray').style('opacity', 0.4);
      }
      if (Ember.isPresent(textMap)) {
        element.selectAll('text').style('fill', textMap[node.name]);
	if (!d3_phylotree_is_leafnode(node)) {
          element.selectAll('circle').style("fill", textMap[node.name]).style('opacity', 0.9);
	}
      } else {
        element.selectAll('text').style("fill", 'Black');
      }
    };
  }.property('seqIdToNodeColor', 'seqIdToMotifColor', 'radialLayout'),

  didInsertElement: function() {
    var svg = d3.select('#' + this.get('elementId'));
    var tree_widget = d3.layout.phylotree()
        .svg(svg)
        .separation(() => 0)
        .style_nodes (this.get('nodeColorizer'))
        .branch_name (this.get('nodeNamer'));

    tree_widget.options ({'is-radial' : this.get('radialLayout')}, false);
    tree_widget.options ({'shift-nodes' : false}, false);
    tree_widget.options ({'overlap-bubbles' : this.get('overlapNodes')}, false);

    if (this.get('showCopynumber')) {
      tree_widget.node_span (this.get('nodeSpan'));
      tree_widget.options ({'draw-size-bubbles' : true}, false);
    } else {
      tree_widget.node_span ('equal');
      tree_widget.options ({'draw-size-bubbles' : false}, false);
    }
    tree_widget.options ({'selectable' : false}, false);
    tree_widget.options ({'internal-names' : true}, false);

    this.set('treeWidget', tree_widget);
    Ember.run.once(this, 'newTree');
  },

  newTree: function() {
    // do not call layout(), since it will be done in sort()
    let tree_widget = this.get('treeWidget');
    tree_widget(this.get('tree'));
    let toMotif = this.get('seqIdToMotif');

    // custom menu
    tree_widget.get_nodes().forEach(function(tree_node) {
      d3_add_custom_menu(
	tree_node,
	// display this text for the menu
	function(node) { return node.name + ' : ' + toMotif[node.name];},
	function() {},
	d3.layout.phylotree.is_leafnode // condition on when to display the menu
      );
    });
    this.sort();
  }.observes('tree', 'seqIdToMotif'),

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

  updateSpacing: function() {
    var widget = this.get('treeWidget');
    widget.options ({'height-scale' : +this.get('heightScale')}, false);
    widget.placenodes();
    widget.update(true);
  }.observes('heightScale'),

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

  updateCopynumber: function() {
    var tree_widget = this.get('treeWidget');
    if (this.get('showCopynumber')) {
      tree_widget.node_span (this.get('nodeSpan'));
      tree_widget.options ({'draw-size-bubbles' : true}, false);
    } else {
      tree_widget.node_span ('equal');
      tree_widget.options ({'draw-size-bubbles' : false}, false);
    }
    tree_widget.placenodes();  // TODO: this is not always necessary
    tree_widget.update(true);
  }.observes('showCopynumber', 'nodeSpan'),

  updateOverlap: function() {
    var tree_widget = this.get('treeWidget');
    tree_widget.options({'overlap-bubbles': this.get('overlapNodes')}, false);
    tree_widget.placenodes();  // TODO: this is not always necessary
    tree_widget.update(true);
  }.observes('overlapNodes'),

  updateLayout: function() {
    var widget = this.get('treeWidget');
    var radial = this.get('radialLayout');
    widget.options ({'is-radial' : radial}, false);
    widget.placenodes();
    widget.update(true);
  }.observes('radialLayout')

});
