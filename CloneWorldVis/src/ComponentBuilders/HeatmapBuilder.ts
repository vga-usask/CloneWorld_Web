/// <reference path="./ComponentBuilderBase.ts" />


namespace ComponentBuilders {
    export class HeatmapBuilder extends SvgBuilder {
        cellSelectedCloneListGetter: (ids: any[]) => Models.CloneInstance[];
        reduceCloneSelectionHandler: (chainList: any) => void;
        selectedCells: { idX: any; idY: any; x: number; y: number; value: number; referenceX: Models.CloneInstance; referenceY: Models.CloneInstance; }[] = [];
        selectedCellListSelection: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        rectangles: d3.Selection<d3.BaseType, { idX: any; idY: any; x: number; y: number; value: number; referenceX: Models.CloneInstance; referenceY: Models.CloneInstance; }, d3.BaseType, {}>;

        normalColorScale: d3.ScaleLinear<number, number>;
        selectionColorScale: d3.ScaleLinear<number, number>;

        currentData: { idX: any, idY: any, x: number, y: number, value: number, referenceX: Models.CloneInstance, referenceY: Models.CloneInstance; }[] = [];
        mouseDown: boolean = false;
        selectedRect: { start: { x: number, y: number }, end: { x: number, y: number } } = { start: undefined, end: undefined };

        buildExtra() {
            super.buildExtra();

            this.mainSelection.style("width", "calc(100% - 100px)");
            this.generateCellSelectionListBox();

            this.mainSelection.append("g").classed("zoomable-g", true);
            this.mainSelection.call(d3.zoom().on("zoom", () => {
                this.mainSelection.select("g.zoomable-g").attr("transform", d3.event.transform);
            }));
        }

        private readonly getCellColorBySelection = data => {
            return this.selectedCells.find(d => (d.idX == data.idX && d.idY == data.idY) || (d.idX == data.idY && d.idY == data.idX)) ?
                this.selectionColorScale(data.value) :
                this.normalColorScale(data.value);
        };

        private readonly cellSelectedHandler: d3.ValueFn<d3.BaseType, { idX: any; idY: any; x: number; y: number; value: number; referenceX: Models.CloneInstance; referenceY: Models.CloneInstance; }, void> = d => {
            this.appendItemToSelectedCells(d);
            this.updateViewWhenCellSelectionChanged();
        };

        private appendItemToSelectedCells(d: { idX: any; idY: any; x: number; y: number; value: number; referenceX: Models.CloneInstance; referenceY: Models.CloneInstance; }) {
            if (this.selectedCells.find(da => (da.idX == d.idX && da.idY == d.idY) || (da.idX == d.idY && da.idY == d.idX))) {
                this.selectedCells.splice(this.selectedCells.findIndex(da => (da.idX == d.idX && da.idY == d.idY) || (da.idX == d.idY && da.idY == d.idX)), 1);
            }
            else {
                this.selectedCells.push(d);
            }
        }

        private updateViewWhenCellSelectionChanged() {
            this.selectedCellListSelection.selectAll("li").remove();
            this.selectedCellListSelection.selectAll("li")
                .data(this.selectedCells)
                .enter()
                .append("li")
                .style("cursor", "pointer")
                .style("font-size", "0.7em")
                .style("color", "white")
                .text(da => "(" + da.idX + ", " + da.idY + ") => " + da.value)
                .on("click", da => {
                    this.selectedCells.splice(this.selectedCells.findIndex((dat) => (da.idX == dat.idX && da.idY == dat.idY) || (da.idX == dat.idY && da.idY == dat.idX)), 1);
                    this.updateCellColorsBySelection();
                    this.selectedCellListSelection.selectAll("li")
                        .filter((dat: any) => (dat.idX == da.idX && dat.idY == da.idY) || (dat.idX == da.idY && dat.idY == da.idX))
                        .remove();
                });
            this.updateCellColorsBySelection();
        }

        updateHighlight(cloneList: Models.CloneInstance[]) {
            this.rectangles.attr("stroke-width", (d: any) => cloneList.find(c => c == d.referenceX || c == d.referenceY) ? 1 : 0);
        }

        dataUpdated(
            data: { idX: any, idY: any, x: number, y: number, value: number, referenceX: Models.CloneInstance, referenceY: Models.CloneInstance }[],
            count: number,
            cellSelectedCloneListGetter: (ids: any[]) => Models.CloneInstance[],
            reduceCloneSelectionHandler: (chainList: any) => void
        ) {
            this.cellSelectedCloneListGetter = cellSelectedCloneListGetter;
            this.reduceCloneSelectionHandler = reduceCloneSelectionHandler;

            this.mainSelection.select("g.zoomable-g").selectAll("*").remove();
            this.selectedCellListSelection.selectAll("li").remove();
            this.selectedCells = [];
            this.currentData = data;

            var rectangleSize = Math.min(this.svgViewBoxWidth, this.svgViewBoxHeight) / count;
            this.normalColorScale = this.getColorScale(["lightblue", "blue"]);
            this.selectionColorScale = this.getColorScale(["lightpink", "red"]);

            this.rectangles = this.generateRectangles(rectangleSize);
            this.appendTitlesToRectangels();

            this.mainSelection.on("contextmenu", () => d3.event.preventDefault());
            this.rectangles.on("click", this.cellSelectedHandler);
            this.rectangles.on("mousedown", d => {
                if (d3.event.button == 2) {
                    this.mouseDown = true;
                    this.selectedRect.start = { x: d.x, y: d.y };
                }
            });
            this.rectangles.on("mouseup", d => {
                if (d3.event.button == 2) {
                    this.mouseDown = false;
                    this.selectedRect.end = { x: d.x, y: d.y };
                    var rect = {
                        minX: Math.min(this.selectedRect.start.x, this.selectedRect.end.x),
                        minY: Math.min(this.selectedRect.start.y, this.selectedRect.end.y),
                        maxX: Math.max(this.selectedRect.start.x, this.selectedRect.end.x),
                        maxY: Math.max(this.selectedRect.start.y, this.selectedRect.end.y)
                    };
                    var filteredData: any[] = this.currentData
                        .filter((d: any) => d.x >= rect.minX && d.x <= rect.maxX && d.y >= rect.minY && d.y <= rect.maxY);
                    filteredData = filteredData.filter((d: any, i) => i == filteredData.findIndex(da => (d.idX == da.idX && d.idY == da.idY) || (d.idX == da.idY && d.idY == da.idX)));
                    for (const d of filteredData) {
                        this.appendItemToSelectedCells(d);
                    }
                    this.updateViewWhenCellSelectionChanged();
                }
            });
        }

        private generateCellSelectionListBox() {
            var cellSelectionListBox = this.container.append("div")
                .classed("selection-list-box", true)
                .style("float", "right")
                .style("width", "100px")
                .style("height", "100%")
                .style("background-color", "gray");
            this.selectedCellListSelection = cellSelectionListBox.append("div")
                .style("height", "calc(100% - 100px)")
                .style("overflow-y", "auto")
                .append("ul")
                .style("list-style-type", "none")
                .style("padding", "1px");
            var buttonsBox = cellSelectionListBox.append("div")
                .style("height", "100px")
            buttonsBox.append("button")
                .style("width", "100%")
                .text("evolution")
                .on("click", () => {
                    var chainList = this.selectedCells.map(d => {
                        var typeX = (d.idX as string).split(":")[0];
                        var idX = (d.idX as string).split("@")[1];
                        return { type: typeX, id: idX, associatingCloneId: d.referenceX.id };
                    });
                    chainList.push(...this.selectedCells.map(d => {
                        var typeY = (d.idY as string).split(":")[0];
                        var idY = (d.idY as string).split("@")[1];
                        return { type: typeY, id: idY, associatingCloneId: d.referenceX.id };
                    }));
                    chainList.filter((d, i) => i == chainList.findIndex(da => da.id == d.id && da.type == d.type));
                    Utilities.openEvolutionVisualizationInNewTab(chainList);
                });
            this.selectedCellListSelection.append("br");
            buttonsBox.append("button")
                .style("width", "100%")
                .text("clear all")
                .on("click", () => {
                    this.selectedCells = [];
                    this.updateViewWhenCellSelectionChanged();
                });
            buttonsBox.append("button")
                .style("width", "100%")
                .text("reduce")
                .on("click", () => this.reduceCloneSelectionHandler(this.selectedCells.map(d => d.idX)));
            buttonsBox.append("button")
                .style("width", "100%")
                .text("sources")
                .on("click", () => {
                    var list = this.selectedCells.map(d => d.idX);
                    list.push(...this.selectedCells.map(d => d.idY));
                    list = list.filter((d, i) => i == list.findIndex(da => da == d));
                    Utilities.openCloneInstanceDetailInNewTabs(this.cellSelectedCloneListGetter(list));
                });
        }

        private updateCellColorsBySelection() {
            this.rectangles.attr("fill", dat => this.getCellColorBySelection(dat));
        }

        private appendTitlesToRectangels() {
            this.rectangles.append("title").text(d => "(" + d.idX + ", " + d.idY + ") => " + d.value);
        }

        private generateRectangles(rectangleSize: number) {
            return this.mainSelection.select("g.zoomable-g").selectAll("rect")
                .data(this.currentData)
                .enter()
                .append("rect")
                .attr("x", d => d.x * rectangleSize + 6)
                .attr("y", d => d.y * rectangleSize + 6)
                .attr("width", rectangleSize)
                .attr("height", rectangleSize)
                .attr("stroke", "orange")
                .attr("stroke-width", 0)
                .attr("fill", d => this.normalColorScale(d.value));
        }

        private getColorScale(range: [string, string]) {
            var colorDomain = d3.extent(this.currentData, d => d.value);
            var colorScale = d3.scaleLinear()
                .domain(colorDomain)
                .range(range as any);
            return colorScale;
        }
    }
}