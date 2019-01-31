/// <reference path="./ComponentBuilderBase.ts" />

namespace ComponentBuilders {
    export class SvgBuilder extends ComponentBuilderBase {
        private readonly DEFAULT_VIEW_BOX_WIDTH = 512;
        private readonly DEFAULT_VIEW_BOX_HEIGHT = 512;

        private get svgViewBox() { return this.mainSelection.attr("viewBox").split(" ") }
        get svgViewBoxWidth() { return +this.svgViewBox[2]; }
        get svgViewBoxHeight() { return +this.svgViewBox[3]; }

        constructor() {
            super();
            this.setTagName("svg");
        }

        protected buildExtra() {
            this.mainSelection
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", 0 + " " + 0 + " " + this.DEFAULT_VIEW_BOX_WIDTH + " " + this.DEFAULT_VIEW_BOX_HEIGHT)
                .style("width", "100%")
                .style("height", "100%")
                .classed("svg-content-responsive", true);
        }
    }
}