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
  seqIdToTextColor: null,
  radialLayout: false,

  minRadius: 1,
  maxRadius: 10,
  spacingOrig: 0,

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
    var textMap = this.get('seqIdToTextColor');
    return (element, data) => {
      if (Ember.isPresent(nodeMap)) {
        element.selectAll('circle').style("fill", nodeMap[data.name]).style('opacity', 0.4);
      } else {
        element.selectAll('circle').style("fill", 'LightGray').style('opacity', 0.4);
      }
      if (Ember.isPresent(textMap)) {
        element.selectAll('text').style('fill', textMap[data.name]);
      } else {
        element.selectAll('text').style("fill", 'Black');
      }
    };
  }.property('seqIdToNodeColor', 'seqIdToTextColor', 'radialLayout'),

  didInsertElement: function() {
    var svg = d3.select('#' + this.get('elementId'));
    var tree_widget = d3.layout.phylotree()
        .svg(svg)
        .size([this.get('height'), this.get('width')])
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

    this.set('treeWidget', tree_widget);
    this.set('spacingOrig', tree_widget.spacing_x());
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

  updateSpacing: function() {
    var widget = this.get('treeWidget');
    var newSpacing = this.get('spacingOrig') + this.get('spaceDelta');
    widget.spacing_x(newSpacing).update(true);
  }.observes('spaceDelta'),

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
