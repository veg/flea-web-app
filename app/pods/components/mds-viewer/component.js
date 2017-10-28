import Ember from 'ember';
import { once } from "@ember/runloop"
import D3Plot from "flea-app/mixins/d3-plot-mixin";
import WidthHeightMixin from 'flea-app/mixins/width-height-mixin';
import { computed, observes } from 'ember-decorators/object';

export default Ember.Component.extend(D3Plot, WidthHeightMixin, {
  copynumbers: null,
  nameToNodeLabel: null,
  nameToNodeColor: null,
  nameToMotifColor: null,
  nameToMotif: null,

  legendLabels: [],
  legendColors: null,

  @computed('data.[]')
  xDomain(data) {
    return d3.extent(data.map(d => d.x));
  },

  @computed('data.[]')
  yDomain(data) {
    return d3.extent(data.map(d => d.y));
  },

  scale(domain, minval, maxval) {
    return d3.scale.linear()
      .domain(domain)
      .range([minval, maxval]);
  },

  @computed('innerWidth', 'xDomain')
  xScale(innerWidth, xDomain) {
    return this.scale(xDomain, 0, innerWidth);
  },

  @computed('innerHeight', 'yDomain')
  yScale(innerHeight, yDomain) {
    return this.scale(yDomain, innerHeight, 0);
  },

  @computed('copynumbers.[]')
  cnDomain(copynumbers) {
    let cns = copynumbers;
    return [0, d3.max(R.values(cns))];
  },

  @computed('cnDomain', 'cnScale')
  margin(cnDomain, cnScale) {
    let cn = cnDomain[1];
    let scale = cnScale;
    let radius = Math.sqrt(scale(cn));
    return {
      top:    radius,
      right:  radius,
      bottom: radius,
      left:   radius,
    };
  },

  @computed('cnDomain')
  cnScale(cnDomain) {
    return d3.scale.linear()
      .domain(cnDomain)
      .range([1, 500]);
  },

  @observes('data.[]', 'nameToNodeColor', 'nameToMotif', 'nameToMotifColor',
            'xScale', 'yScale', 'cnScale',
            'copynumbers.[]', 'highlightedNodes')
  onChartChange() {
    // override this if need to observe more than just data
    if (this._state !== 'inDOM') {
      return;
    }
    once(this, '_updateChart');
  },

  _updateChart() {
    let svg = d3.select('#' + this.get('elementId')).select('.inner').select('.circles');
    let data = this.get('data');
    let xScale = this.get('xScale');
    let yScale = this.get('yScale');
    let cnScale = this.get('cnScale');
    let cns = this.get('copynumbers');
    let nameToNodeColor = this.get('nameToNodeColor');
    let nameToMotif = this.get('nameToMotif');
    let nameToMotifColor = this.get('nameToMotifColor');
    let highlightedNodes = this.get('highlightedNodes');

    let circles = svg.selectAll("circle").data(data, d => d.name);

    d3.select("body").select(".tooltip").remove();
    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    circles.enter()
      .append("circle");

    circles.exit().remove();

    circles
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => 1.5 * Math.sqrt(cnScale(cns[d.name])))
      .style("fill", d => nameToNodeColor[d.name])
      .style("opacity", d => {
        if (highlightedNodes.length === 0) {
          return 1.0;
        }
        if (highlightedNodes.has(d.name)) {
          return 1.0;
        } else {
          return 0.1;
        }
      })
      .on("mouseover", d => {
        let html = d.name;
        let color = 'black';
        if (nameToMotif[d.name]) {
          html += ' : ' + nameToMotif[d.name];
          color = nameToMotifColor[d.name];
        }
        div.transition()
          .duration(100)
          .style("opacity", 0.9);
        div.html(html)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style('color', color);
      })
      .on("mouseout", () => {
        div.transition()
          .duration(100)
          .style("opacity", 0);
      });
  },
});
