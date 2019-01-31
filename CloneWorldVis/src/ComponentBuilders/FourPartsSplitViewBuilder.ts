/// <reference path="./ComponentBuilderBase.ts" />

namespace ComponentBuilders {
    export class FourPartsSplitViewBuilder extends ComponentBuilderBase {
        private upper_left: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        private upper_right: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        private lower_left: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        private lower_right: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

        get upper_left_selection() { return this.upper_left; }
        get upper_right_selection() { return this.upper_right; }
        get lower_left_selection() { return this.lower_left; }
        get lower_right_selection() { return this.lower_right; }

        constructor() {
            super();
            this.setTagName("div");
            this.setClassName("svg-split-view");
        }

        protected buildExtra() {
            this.generateDivs();
            this.splitDivs();
        }

        private splitDivs() {
            Split(["#svg-split-view-upper", "#svg-split-view-lower"], {
                direction: "vertical",
                gutterSize: 2,
                cursor: "row-resize"
            });
            Split(["#svg-split-view-upper-left", "#svg-split-view-upper-right"], {
                gutterSize: 2,
                cursor: "col-resize"
            });
            Split(["#svg-split-view-lower-left", "#svg-split-view-lower-right"], {
                gutterSize: 2,
                cursor: "col-resize"
            });
        }

        private generateDivs() {
            var upper = this.container.append("div")
                .classed("split", true)
                .attr("id", "svg-split-view-upper");
            var lower = this.container.append("div")
                .classed("split", true)
                .attr("id", "svg-split-view-lower");
            this.upper_left = upper.append("div")
                .classed("split", true)
                .classed("split-horizontal", true)
                .classed("content", true)
                .style("overflow", "hidden")
                .attr("id", "svg-split-view-upper-left");
            this.upper_right = upper.append("div")
                .classed("split", true)
                .classed("split-horizontal", true)
                .classed("content", true)
                .style("overflow", "hidden")
                .attr("id", "svg-split-view-upper-right");
            this.lower_left = lower.append("div")
                .classed("split", true)
                .classed("split-horizontal", true)
                .classed("content", true)
                .style("overflow", "hidden")
                .attr("id", "svg-split-view-lower-left");
            this.lower_right = lower.append("div")
                .classed("split", true)
                .classed("split-horizontal", true)
                .classed("content", true)
                .style("overflow", "hidden")
                .attr("id", "svg-split-view-lower-right");
        }
    }
}