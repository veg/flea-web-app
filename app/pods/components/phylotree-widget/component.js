import Ember from 'ember';
import { once } from "@ember/runloop"
import { computed, observes } from 'ember-decorators/object';

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
  seqNameToNodeName: null,
  seqNameToNodeColor: null,
  seqNameToMotifColor: null,
  seqNameToMotif: null,
  radialLayout: false,

  minRadius: 0.1,
  maxRadius: 10,
  heightScale: 1.0,

  @computed('copynumbers', 'minRadius', 'maxRadius')
  nodeSpan(nameToCn, minRadius, maxRadius) {
    let max = d3.max(R.values(nameToCn));
    let scale = d3.scale.sqrt()
        .domain([0, max])
        .range([minRadius, maxRadius]);
    return node => (node.name in nameToCn) ? scale(nameToCn[node.name]) : scale(1);
  },

  @computed('seqNameToNodeName')
  nodeNamer(map) {
    if (!map) {
      return x => x.name;
    }
    return data => {
      return (Ember.isPresent(map[data.name]) ? map[data.name] : "");
    };
  },

  @computed('seqNameToNodeColor', 'seqNameToMotifColor')
  nodeColorizer(nodeMap, textMap) {
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
  },

  didInsertElement() {
    this._super(...arguments);
    let svg = d3.select('#' + this.get('elementId'));
    let treeWidget = d3.layout.phylotree()
        .svg(svg)
        .separation(() => 0)
        .style_nodes (this.get('nodeColorizer'))
        .branch_name (this.get('nodeNamer'));

    treeWidget.options ({'is-radial' : this.get('radialLayout')}, false);
    treeWidget.options ({'shift-nodes' : false}, false);
    treeWidget.options ({'overlap-bubbles' : this.get('overlapNodes')}, false);

    if (this.get('showCopynumber')) {
      treeWidget.node_span (this.get('nodeSpan'));
      treeWidget.options ({'draw-size-bubbles' : true}, false);
    } else {
      treeWidget.node_span ('equal');
      treeWidget.options ({'draw-size-bubbles' : false}, false);
    }
    treeWidget.options ({'selectable' : false}, false);
    treeWidget.options ({'internal-names' : true}, false);

    this.set('treeWidget', treeWidget);
    once(this, 'newTree');
  },

  @observes('tree', 'seqNameToMotif')
  newTree() {
    let tree = this.get('tree');
    let toMotif = this.get('seqNameToMotif');
    let treeWidget = this.get('treeWidget');
    // do not call layout(), since it will be done in sort()
    treeWidget(tree);

    // custom menu
    treeWidget.get_nodes().forEach(tree_node => {
      d3_add_custom_menu(
	tree_node,
	// display this text for the menu
	node => node.name + ' : ' + toMotif[node.name],
	() => {},
	d3.layout.phylotree.is_leafnode // condition on when to display the menu
      );
    });
    this.sort();
  },

  @observes('sortState')
  sort() {
    let sortState = this.get('sortState');
    if (sortState === "ascending") {
      this.sortNodes(true);
    } else if (sortState === "descending") {
      this.sortNodes(false);
    } else {
      this.sortOriginal();
    }
  },

  sortNodes(ascending) {
    let widget = this.get('treeWidget');
    widget.traverse_and_compute (n => {
      let d = 1;
      if (n.children && n.children.length) {
        d += d3.max (n.children, d => d["count_depth"]);
      }
      n["count_depth"] = d;
    });
    widget.resort_children((a,b) => {
      return (a["count_depth"] - b["count_depth"]) * (ascending ? 1 : -1);
    });
  },

  sortOriginal() {
    this.get('treeWidget').resort_children( (a,b) => {
      return a["original_child_order"] - b["original_child_order"];
    });
  },

  @observes('heightScale')
  updateSpacing() {
    let heightScale = this.get('heightScale');
    let widget = this.get('treeWidget');
    widget.options ({'height-scale' : +heightScale}, false);
    widget.placenodes();
    widget.update(true);
  },

  @observes('nodeNamer')
  updateNames() {
    let nodeNamer = this.get('nodeNamer');
    let widget = this.get('treeWidget');
    widget.branch_name(nodeNamer);
    widget.update();
  },

  @observes('nodeColorizer')
  updateColors() {
    let nodeColorizer = this.get('nodeColorizer');
    let widget = this.get('treeWidget');
    widget.style_nodes (nodeColorizer);
    widget.refresh();
  },

  @observes('showCopynumber', 'nodeSpan')
  updateCopynumber() {
    let showCopynumber = this.get('showCopynumber');
    let nodeSpan = this.get('nodeSpan');
    let treeWidget = this.get('treeWidget');
    if (showCopynumber) {
      treeWidget.node_span (nodeSpan);
      treeWidget.options ({'draw-size-bubbles' : true}, false);
    } else {
      treeWidget.node_span ('equal');
      treeWidget.options ({'draw-size-bubbles' : false}, false);
    }
    treeWidget.placenodes();  // TODO: this is not always necessary
    treeWidget.update(true);
  },

  @observes('overlapNodes')
  updateOverlap() {
    let overlapNodes = this.get('overlapNodes');
    let widget = this.get('treeWidget');
    widget.options({'overlap-bubbles': overlapNodes}, false);
    widget.placenodes();  // TODO: this is not always necessary
    widget.update(true);
  },

  @observes('radialLayout')
  updateLayout() {
    let radial = this.get('radialLayout');
    let widget = this.get('treeWidget');
    widget.options ({'is-radial' : radial}, false);
    widget.placenodes();
    widget.update(true);
  }

});
