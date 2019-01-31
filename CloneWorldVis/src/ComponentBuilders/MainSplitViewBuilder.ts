/// <reference path="./ComponentBuilderBase.ts" />


namespace ComponentBuilders {
    export class MainSplitViewBuilder extends ComponentBuilderBase {
        private vis_view: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        private control_view: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

        public get vis_view_selection() { return this.vis_view; }
        public get control_view_selection() { return this.control_view; }

        constructor() {
            super();
            this.setTagName("div")
                .setIdName("main-split-view");
        }

        protected buildExtra(): void {
            this.mainSelection.remove();
            this.generateElements();
            this.splitViews();
        }


        updateSourceCodeDispaly(index: number, path: any, highlight: number[]) {
            var el: any = d3.selectAll("div.source-code-view").filter((d: number) => d == index).node();
            var ele = document.createElement("ol");
            d3.text("data_files/src/" + path)
                .then(d => {
                    var lines = d.split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        var li = document.createElement("li");
                        li.innerText = lines[i];
                        if (highlight.find(d => d == i + 1)) {
                            li.style.backgroundColor = "lightgreen";
                        }
                        ele.appendChild(li);
                    }
                })
                .catch(d => ele.innerHTML = "File not found in current revision.");
            var pathText = el.getElementsByClassName("source-code-path-text")[0];
            pathText.innerText = path;
            pathText.title = path;
            var container = el.getElementsByClassName("source-code-container")[0];
            container.innerHTML = "";
            container.appendChild(ele);
        }

        private splitViews() {
            Split(['#upper-view', '#lower-view'], {
                direction: 'vertical',
                sizes: [70, 30],
                gutterSize: 5,
                cursor: 'row-resize'
            });
            Split(['#vis-view', '#control-view'], {
                sizes: [75, 25],
                gutterSize: 5,
                cursor: 'col-resize'
            });
            Split(['#source-view-1', '#source-view-2', '#source-view-3'], {
                gutterSize: 5,
                cursor: 'col-resize'
            });
        }

        private generateElements() {
            var upperView = this.container.append("div")
                .classed("split", true)
                .attr("id", "upper-view");
            var lowerView = this.container.append("div")
                .classed("split", true)
                .attr("id", "lower-view");
            var visView = upperView.append("div")
                .classed("split split-horizontal content", true)
                .attr("id", "vis-view");
            var controlView = upperView.append("div")
                .classed("split split-horizontal content", true)
                .attr("id", "control-view");
            var sourceViews = lowerView.selectAll("div")
                .data([1, 2, 3])
                .enter()
                .append("div")
                .classed("split split-horizontal content source-code-view", true)
                .attr("id", d => "source-view-" + d)
                .style("position", "relative")
                .on("drop", d => {
                    var ev = d3.event;
                    ev.preventDefault();
                    var passedData = JSON.parse(ev.dataTransfer.getData("fileInfo"));
                    var path = passedData.path;
                    var highlight: number[] = passedData.highlight;
                    this.updateSourceCodeDispaly(d, path, highlight);
                })
                .on("dragover", d => d3.event.preventDefault());
            sourceViews.append("label")
                .classed("source-code-path-text", true)
                .style("position", "fixed")
                .style("left", 25)
                .style("width", "calc(33.3% - 50px)")
                .style("text-overflow", "ellipsis")
                .style("overflow", "hidden")
                .style("color", "palevioletred")
                .style("background-color", "wheat");
            sourceViews.append("div")
                .classed("source-code-container", true)
                .append("p")
                .text("Right click on file node to open file here");

            this.vis_view = visView;
            this.control_view = controlView;
        }
    }
}