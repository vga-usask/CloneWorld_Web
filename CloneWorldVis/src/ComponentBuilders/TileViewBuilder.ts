/// <reference path="./SvgBuilder.ts" />


namespace ComponentBuilders {
    export class TileViewBuilder extends SvgBuilder {
        tile: any;
        raster: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        mouseSelection: { start: [number, number], end: [number, number] };
        mouseSelectionRect: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

        mouseDown = false;
        imageDirectoryPath: string;

        buildExtra() {
            super.buildExtra();

            this.mainSelection.style("width", "calc(100% - 100px)");
        }

        imagePathUpdated(path: string) {
            this.imageDirectoryPath = path;
            if (this.raster) {
                this.raster.selectAll("image").attr("xlink:href", d =>
                    d[1] + 1 > Math.pow(2, d[2] + 1) || d[0] + 1 > Math.pow(2, d[2] + 1) ?
                        "" : this.imageDirectoryPath + "/" + (d[2] + 1) + "_" + d[1] + "_" + d[0] + ".png"
                );
            }
        }

        cloneDataSetUpdated(
            cloneDataSet: Models.CloneDataSet,
            selectedRangeUpdatedHandler: (selectedClones: Models.CloneInstance[]) => void
        ) {
            this.setSvgSizeAsContainerSize();
            this.setSvgViewBoxSizeBasedOnRealWidthAndHeight();

            this.generateStatistics(cloneDataSet);
            this.generateVisualization(cloneDataSet, selectedRangeUpdatedHandler);
        }

        private generateVisualization(
            cloneDataSet: Models.CloneDataSet,
            selectedRangeUpdatedHandler: (selectedClones: Models.CloneInstance[]) => void
        ) {
            this.mouseSelection = { start: [0, 0], end: [0, 0] };
            this.tile = this.initializeTileObject();
            this.mouseSelectionRect = this.mainSelection.append("rect").classed("mouse_selection_rect", true);

            this.setSvgZoom();
            this.setCursorAsNone();

            this.setSvgGuideLines();
            this.setSvgPromptText(cloneDataSet);
            this.setSvgRangeSelection(cloneDataSet, selectedRangeUpdatedHandler);
        }

        private setSvgRangeSelection(
            cloneDataSet: Models.CloneDataSet,
            selectedRangeUpdatedHandler: (selectedClones: Models.CloneInstance[]) => void
        ) {
            this.mouseDown = false;
            this.mainSelection.on("contextmenu", () => d3.event.preventDefault())
                .on("click", () => alert(this.getRelativeCoordinate(d3.mouse(this.mainSelection.node() as any), this.tile)))
                .on("mousedown.selectRange", this.selectRangeMouseDownHandler())
                .on("mousemove.selectRange", this.selectRangeMouseMoveHandler())
                .on("mouseup.selectRange", this.selectRangeMouseUpHandler(cloneDataSet, selectedRangeUpdatedHandler));
        }

        private selectRangeMouseUpHandler(
            cloneDataSet: Models.CloneDataSet,
            selectedRangeUpdatedHandler: (selectedClones: Models.CloneInstance[]) => void
        ): d3.ValueFn<d3.BaseType, {}, void> {
            return () => {
                if (d3.event.button == 2) {
                    var position = d3.mouse(this.mainSelection.node() as any);
                    this.mouseDown = false;
                    var relativeCoodinate = this.getRelativeCoordinate(position, this.tile);
                    this.mouseSelection.end = relativeCoodinate;
                    var rangedCloneList: Models.CloneInstance[] = [];
                    for (const clone of cloneDataSet.cloneList) {
                        let minX = Math.min(this.mouseSelection.start[0], this.mouseSelection.end[0]);
                        let maxX = Math.max(this.mouseSelection.start[0], this.mouseSelection.end[0]);
                        let minY = Math.min(this.mouseSelection.start[1], this.mouseSelection.end[1]);
                        let maxY = Math.max(this.mouseSelection.start[1], this.mouseSelection.end[1]);
                        if (clone.x >= minX && clone.x <= maxX && clone.y >= minY && clone.y <= maxY) {
                            rangedCloneList.push(clone);
                        }
                    }
                    selectedRangeUpdatedHandler(rangedCloneList);
                }
            };
        }

        private selectRangeMouseMoveHandler(): d3.ValueFn<d3.BaseType, {}, void> {
            return () => {
                var position = d3.mouse(this.mainSelection.node() as any);
                var relativeCoodinate = this.getRelativeCoordinate(position, this.tile);
                if (this.mouseDown) {
                    this.mouseSelection.end = relativeCoodinate;

                    var startPosition = this.getAbsoluteCoordinate(this.mouseSelection.start, this.tile);
                    var endPosition = this.getAbsoluteCoordinate(this.mouseSelection.end, this.tile);
                    this.mouseSelectionRect.attr("x", Math.min(startPosition[0], endPosition[0]))
                        .attr("y", Math.min(startPosition[1], endPosition[1]))
                        .attr("width", d => Math.max(startPosition[0], endPosition[0]) - Math.min(startPosition[0], endPosition[0]))
                        .attr("height", d => Math.max(startPosition[1], endPosition[1]) - Math.min(startPosition[1], endPosition[1]));
                }
            };
        }


        private selectRangeMouseDownHandler(): d3.ValueFn<d3.BaseType, {}, void> {
            return () => {
                if (d3.event.button == 2) {
                    var position = d3.mouse(this.mainSelection.node() as any);
                    this.mouseDown = true;
                    this.mouseSelectionRect.attr("x", position[0])
                        .attr("y", position[1])
                        .attr("width", 0)
                        .attr("height", 0)
                        .attr("opacity", .3);
                    this.mouseSelection.start = this.getRelativeCoordinate(position, this.tile);
                }
            };
        }

        private setSvgPromptText(cloneDataSet: Models.CloneDataSet) {
            var promptText = this.mainSelection.append("text");
            this.mainSelection.on("mousemove.promptText", () => {
                var position = d3.mouse(this.mainSelection.node() as any);
                var relativeCoodinate = this.getRelativeCoordinate(position, this.tile);
                if (relativeCoodinate[0] > 0 && relativeCoodinate[0] < 1 && relativeCoodinate[1] > 0 && relativeCoodinate[1] < 1) {
                    var str = "Type " + cloneDataSet.classList[Math.round(cloneDataSet.classList.length * relativeCoodinate[1])].type.toString();
                    str += ", ";
                    str += "Class " + cloneDataSet.classList[Math.round(cloneDataSet.classList.length * relativeCoodinate[1])].id.toString();
                    str += ", ";
                    str += cloneDataSet.fileList[Math.round(cloneDataSet.fileList.length * relativeCoodinate[0]) - 1].path;
                    promptText.attr("x", 10).attr("y", 20).style("font-size", "12px").text(str);
                }
            });
        }

        private setSvgGuideLines() {
            var mouseHorizontalLine = this.mainSelection.append("line").classed("guide-line", true);
            var mouseVerticalLine = this.mainSelection.append("line").classed("guide-line", true);
            this.mainSelection.on("mousemove.guidelines", () => {
                var position = d3.mouse(this.mainSelection.node() as any);
                mouseHorizontalLine.attr("stroke", "red")
                    .attr("x1", -99999)
                    .attr("y1", position[1])
                    .attr("x2", 99999)
                    .attr("y2", position[1]);
                mouseVerticalLine.attr("stroke", "red")
                    .attr("x1", position[0])
                    .attr("y1", -99999)
                    .attr("x2", position[0])
                    .attr("y2", 99999);
            });
        }

        private getRelativeCoordinate(position: [number, number], transformObject: any) {
            var result: [number, number] = [null, null];

            result[0] = ((position[0] - transformObject.translate()[0]) / transformObject.scale() / 2 + 0.25) / 0.99 - 0.005;
            result[1] = 1 - (((position[1] - transformObject.translate()[1]) / transformObject.scale() / 2 + 0.25)) / 0.99 + 0.005;

            return result;
        }

        private getAbsoluteCoordinate(position: [number, number], transformObject: any) {
            var result: [number, number] = [null, null];

            result[0] = ((position[0] + 0.005) * 0.99 - 0.25) * 2 * transformObject.scale() + transformObject.translate()[0];
            result[1] = ((1 - position[1] + 0.005) * 0.99 - 0.25) * 2 * transformObject.scale() + transformObject.translate()[1];

            return result;
        }

        private setCursorAsNone() {
            this.mainSelection.on("mouseover", () => this.mainSelection.style("cursor", "none"))
                .on("mouseout", () => this.mainSelection.style("cursor", ""));
        }

        private setSvgZoom() {
            this.raster = this.mainSelection.insert("g", "rect.mouse_selection_rect")
                .classed("raster", true);
            var zoom = this.initializeZoomObject();
            this.mainSelection.call(zoom)
                .call(zoom.transform, d3.zoomIdentity
                    // .translate(64, 0)
                    .translate(128, 128)
                    .scale(1 << 8));
        }

        private setSvgSizeAsContainerSize() {
            this.mainSelection.attr("width", this.containerWidth)
                .attr("height", this.containerHeight);
        }

        private initializeZoomObject() {
            return d3.zoom()
                .scaleExtent([1 << 8, 1 << 12])
                .on("zoom", this.zoomed());
        }

        private initializeTileObject() {
            return (d3 as any).tile()
                .size([this.mainSelection.attr("viewBox").split(" ")[2],
                this.mainSelection.attr("viewBox").split(" ")[2]]);
        }

        private setSvgViewBoxSizeBasedOnRealWidthAndHeight() {
            if (this.mainSelectionWidth > this.mainSelectionHeight) {
                this.mainSelection.attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", 0 + " " + 0 + " " + this.svgViewBoxWidth / this.mainSelectionHeight * this.mainSelectionWidth + " " + this.svgViewBoxWidth);
            }
            else {
                this.mainSelection.attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", 0 + " " + 0 + " " + this.svgViewBoxWidth + " " + this.svgViewBoxHeight / this.mainSelectionWidth * this.mainSelectionHeight);
            }
        }

        private generateStatistics(cloneDataSet: Models.CloneDataSet) {
            var statisticsBox = this.container.append("div")
                .classed("statistics-box", true)
                .style("float", "right")
                .style("width", "100px")
                .style("height", "100%")
                .style("overflow-y", "auto")
                .style("background-color", "gray");
            var ul = statisticsBox.append("ul")
                .style("list-style-type", "none")
                .style("padding", "1px");
            ul.selectAll("li")
                .data([
                    "ALL REV.",
                    "Classes: " + cloneDataSet.classList.length,
                    "Clones: " + cloneDataSet.cloneList.length,
                    "Type 1: " + cloneDataSet.cloneList.filter(d => d.classType == "1").length,
                    "Type 2: " + cloneDataSet.cloneList.filter(d => d.classType == "2").length,
                    "Type 3: " + cloneDataSet.cloneList.filter(d => d.classType == "3").length,
                    "---------------",
                    "LAST REV.",
                    "Classes: " + cloneDataSet.cloneList.filter((d, i) => d.finalRevision == cloneDataSet.systemInfo.finalRevision && cloneDataSet.cloneList.findIndex(c => c.classType == d.classType && c.classId == d.classId) == i).length,
                    "Clones: " + cloneDataSet.cloneList.filter(d => d.finalRevision == cloneDataSet.systemInfo.finalRevision).length,
                    "Type 1: " + cloneDataSet.cloneList.filter(d => d.classType == "1").filter(d => d.finalRevision == cloneDataSet.systemInfo.finalRevision).length,
                    "Type 2: " + cloneDataSet.cloneList.filter(d => d.classType == "2").filter(d => d.finalRevision == cloneDataSet.systemInfo.finalRevision).length,
                    "Type 3: " + cloneDataSet.cloneList.filter(d => d.classType == "3").filter(d => d.finalRevision == cloneDataSet.systemInfo.finalRevision).length,
                    "---------------",
                    "CHANGES",
                    "Type 1: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "1" ? 1 : 0 as number)).reduce((total, num) => total + num),
                    "Type 2: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "2" ? 1 : 0 as number)).reduce((total, num) => total + num),
                    "Type 3: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "3" ? 1 : 0 as number)).reduce((total, num) => total + num)
                ])
                .enter()
                .append("li")
                .style("font-size", "0.7em")
                .style("color", "white")
                .text(d => d);
        }

        private zoomed(): d3.ValueFn<Element, {}, void> {
            return () => {
                var transform = d3.event.transform;
                var tiles = this.updateTilesZoom(transform);
                this.updateImagesZoom(tiles);

                this.mainSelection.selectAll(".guide-line").attr("stroke", "transparent");

                var startPosition = this.getAbsoluteCoordinate(this.mouseSelection.start, this.tile);
                var endPosition = this.getAbsoluteCoordinate(this.mouseSelection.end, this.tile);
                this.mouseSelectionRect.attr("x", Math.min(startPosition[0], endPosition[0]))
                    .attr("y", Math.min(startPosition[1], endPosition[1]))
                    .attr("width", d => Math.max(startPosition[0], endPosition[0]) - Math.min(startPosition[0], endPosition[0]))
                    .attr("height", d => Math.max(startPosition[1], endPosition[1]) - Math.min(startPosition[1], endPosition[1]));
            };
        }

        private updateImagesZoom(tiles: any) {
            var image = this.raster
                .attr("transform", this.stringify(tiles.scale, tiles.translate))
                .selectAll("image")
                .data(tiles, (d: any) => d);
            image.exit().remove();
            image.enter().append("image")
                .attr("xlink:href", (d: any) => {
                    return d[1] + 1 > Math.pow(2, d[2] + 1) || d[0] + 1 > Math.pow(2, d[2] + 1) ?
                        "" : this.imageDirectoryPath + "/" + (d[2] + 1) + "_" + d[1] + "_" + d[0] + ".png";
                })
                .attr("x", (d: any) => d[0] * 256)
                .attr("y", (d: any) => d[1] * 256)
                .attr("width", 256)
                .attr("height", 256);
        }

        private updateTilesZoom(transform: any) {
            return this.tile
                .scale(transform.k)
                .translate([transform.x, transform.y])();
        }

        private stringify(scale, translate) {
            var k = scale / 256, r = scale % 1 ? Number : Math.round;
            return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
        }
    }
}