var Utilities;
(function (Utilities) {
    Utilities.SYSTEM_INFO_DATA_FILE_PATH = "data_files/system.json";
    Utilities.CLASS_LIST_DATA_FILE_PATH = "data_files/classes.json";
    Utilities.FILE_LIST_DATA_FILE_PATH = "data_files/files.json";
    Utilities.CLONE_LIST_DATA_FILE_PATH = "data_files/clones.json";
    Utilities.SUPPORT_COUNT_MAP_DATA_FILE_PATH = "data_files/support_count_map.json";
    Utilities.openCloneInstanceDetailInNewTabs = (clones) => {
        if (confirm(clones.length + " tab(s) would be opened.")) {
            for (const clone of clones) {
                d3.text("data_files/src/" + clone.filePath)
                    .then(d => {
                    var doc = document.createElement("div");
                    var ol = document.createElement("ol");
                    var lines = d.split("\n");
                    var firstHighlightedLine = 0;
                    for (let i = 0; i < lines.length; i++) {
                        var li = document.createElement("li");
                        li.innerText = lines[i];
                        if (i + 1 >= clone.startLine && i + 1 <= clone.endLine) {
                            if (firstHighlightedLine == 0) {
                                firstHighlightedLine = i;
                            }
                            li.style.backgroundColor = "lightgreen";
                        }
                        ol.appendChild(li);
                    }
                    var header = document.createElement("h1");
                    header.innerText = clone.filePath;
                    doc.appendChild(header);
                    doc.appendChild(ol);
                    var win = window.open();
                    win.document.write("<html><head><title>" + clone.filePath + "</title></head><body>" + doc.innerHTML + "</body></html>");
                    win.scrollTo(0, win.document.getElementsByTagName("li")[firstHighlightedLine].getBoundingClientRect().top);
                })
                    .catch(() => {
                    var win = window.open();
                    win.document.title = clone.filePath;
                    win.document.write("File not found in current revision.");
                });
            }
        }
    };
    Utilities.openEvolutionVisualizationInNewTab = (chainList) => {
        var data = { types: [] };
        for (const chain of chainList) {
            var type = data.types.find(d => d.id == chain.type);
            if (!type) {
                type = { id: chain.type, chains: [], associatingCloneIds: [] };
                data.types.push(type);
            }
            type.chains.push(chain.id);
            type.associatingCloneIds.push(chain.associatingCloneId);
        }
        var win = window.open("secondary_vis/index.html");
        win.onload = () => win.loadInfo(Models.MainModel.SystemName, data);
    };
})(Utilities || (Utilities = {}));
var ComponentBuilders;
(function (ComponentBuilders) {
    class ComponentBuilderBase {
        get containerBoundingClientRect() { return this.container.node().getBoundingClientRect(); }
        get mainSelectionBoundingClientRect() { return this.container.node().getBoundingClientRect(); }
        get containerWidth() { return this.containerBoundingClientRect.width; }
        get containerHeight() { return this.containerBoundingClientRect.height; }
        get mainSelectionWidth() { return this.mainSelectionBoundingClientRect.width; }
        get mainSelectionHeight() { return this.mainSelectionBoundingClientRect.height; }
        setContainer(container) {
            this.container = container;
            return this;
        }
        setTagName(tagName) {
            this.tagName = tagName;
            return this;
        }
        setClassName(className) {
            this.className = className;
            return this;
        }
        setIdName(idName) {
            this.idName = idName;
            return this;
        }
        build() {
            this.mainSelection = this.container.append(this.tagName);
            if (this.className)
                this.mainSelection.classed(this.className, true);
            if (this.idName)
                this.mainSelection.attr("id", this.idName);
            this.buildExtra();
            return this;
        }
    }
    ComponentBuilders.ComponentBuilderBase = ComponentBuilderBase;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./ComponentBuilderBase.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class SvgBuilder extends ComponentBuilders.ComponentBuilderBase {
        constructor() {
            super();
            this.DEFAULT_VIEW_BOX_WIDTH = 512;
            this.DEFAULT_VIEW_BOX_HEIGHT = 512;
            this.setTagName("svg");
        }
        get svgViewBox() { return this.mainSelection.attr("viewBox").split(" "); }
        get svgViewBoxWidth() { return +this.svgViewBox[2]; }
        get svgViewBoxHeight() { return +this.svgViewBox[3]; }
        buildExtra() {
            this.mainSelection
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", 0 + " " + 0 + " " + this.DEFAULT_VIEW_BOX_WIDTH + " " + this.DEFAULT_VIEW_BOX_HEIGHT)
                .style("width", "100%")
                .style("height", "100%")
                .classed("svg-content-responsive", true);
        }
    }
    ComponentBuilders.SvgBuilder = SvgBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./ComponentBuilderBase.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class MainSplitViewBuilder extends ComponentBuilders.ComponentBuilderBase {
        constructor() {
            super();
            this.setTagName("div")
                .setIdName("main-split-view");
        }
        get vis_view_selection() { return this.vis_view; }
        get control_view_selection() { return this.control_view; }
        buildExtra() {
            this.mainSelection.remove();
            this.generateElements();
            this.splitViews();
        }
        updateSourceCodeDispaly(index, path, highlight) {
            var el = d3.selectAll("div.source-code-view").filter((d) => d == index).node();
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
        splitViews() {
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
        generateElements() {
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
                var highlight = passedData.highlight;
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
    ComponentBuilders.MainSplitViewBuilder = MainSplitViewBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./ComponentBuilderBase.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class ControlPanelBuilder extends ComponentBuilders.ComponentBuilderBase {
        constructor() {
            super();
            this.setTagName("div");
        }
        buildExtra() {
            this.mainSelection.style("overflow-y", "auto")
                .style("margin", "5px")
                .style("font-size", "0.7em");
        }
        updateFragmentViewNodeColorControl(enabled, defaultValue) {
            if (this.fragmentViewNodeColorControl) {
                this.updateDropDownControl(this.fragmentViewNodeColorControl, enabled, undefined, undefined, undefined, defaultValue);
            }
        }
        updateFragmentViewEdgeTypeControl(enabled, defaultValue) {
            if (this.fragmentViewNodeColorControl) {
                this.updateDropDownControl(this.fragmentViewEdgeTypeControl, enabled, undefined, undefined, undefined, defaultValue);
            }
        }
        initialize(mainModel) {
            this.generateGlobalControls(mainModel);
            this.mainSelection.append("hr");
            this.generateFragmentViewControls(mainModel);
            this.mainSelection.append("hr");
            this.generateFileViewControls(mainModel);
        }
        generateGlobalControls(mainModel) {
            var globalControl = this.generateControlGroup("CONTROL PANEL");
            this.generateCheckBoxControl(globalControl, true, "Clone Landscape", mainModel.isSummaryViewShowingContourUpdatedHandler, true);
            this.generateCheckBoxControl(globalControl, true, "Last Revision Only", mainModel.isShowingOnlyTheLastRevisionUpdatedHandler, true);
            this.generateSliderControl(globalControl, true, "Support Count >= ", mainModel.selectionFilterLowerLimitBySupportCountUpdatedHandler, 0, mainModel.maxSumChangeCount, 1);
            this.generateSliderControl(globalControl, true, "At Most", mainModel.maxSelectionLimitationByChangeCountUpdatedHandler, 0, 2000, 150, "Clones");
            this.generateTextBoxControl(globalControl, true, "Search {type}:{class id}:{clone id}|{file path}", mainModel.controlPanelSearchCloneHandler);
        }
        generateFragmentViewControls(mainModel) {
            var fragmentViewControl = this.generateControlGroup("CLONE COMMUNITY VIEW");
            this.generateDropDownControl(fragmentViewControl, true, "Nodes Represent", ["class", "clone fragment"], mainModel.fragmentViewNodeTypeUpdatedHandler, "clone fragment");
            this.fragmentViewEdgeTypeControl = this.generateDropDownControl(fragmentViewControl, true, "Edges Represent", ["class", "file", "support count"], mainModel.fragmentViewEdgeTypeUpdatedHandler, "class");
            this.fragmentViewNodeColorControl = this.generateDropDownControl(fragmentViewControl, true, "Nodes colored by", ["automatic", "directory", "class"], mainModel.fragmentViewNodeColorUpdatedHandler, "directory");
        }
        generateFileViewControls(mainModel) {
            var fileViewControl = this.generateControlGroup("FILE COMMUNITY VIEW");
            this.generateDropDownControl(fileViewControl, true, "Nodes colored by", ["automatic", "directory"], mainModel.fileViewNodeColorUpdatedHandler, "directory");
            this.generateDropDownControl(fileViewControl, true, "Edges Represent", ["class", "support count"], mainModel.controlPanelFileViewEdgeTypeUpdatedHandler, "class");
        }
        generateControlGroup(label) {
            var div = this.mainSelection;
            div.append("div")
                .append("h3")
                .text(label)
                .style("margin", 0);
            return div;
        }
        generateTextBoxControl(container, enabled, label, changedHandler, defaultValue) {
            var control = this.generateControlItem(container);
            control.append("br");
            control.append("input")
                .attr("type", "text")
                .classed("control-interact", true);
            this.updateTextBoxControl(control, enabled, label, changedHandler, defaultValue);
            control.append("br");
            control.append("label").classed("control-text-box-result-text", true);
            return control;
        }
        updateTextBoxControl(control, enabled, label, changedHandler, defaultValue) {
            this.updateControlItem(control, enabled, label);
            if (changedHandler) {
                control.on("change", () => {
                    var ele = control.select("input.control-interact").node();
                    control.select("label.control-text-box-result-text")
                        .text(changedHandler(ele.value));
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node();
                ele.value = defaultValue;
                control.on("change")(ele.value);
            }
        }
        generateSliderControl(container, enabled, label, changedHandler, minValue, maxValue, defaultValue, textAfterValue) {
            var control = this.generateControlItem(container);
            control.append("label").classed("control-slider-value-text", true);
            control.append("label").classed("control-slider-text-after-value", true);
            control.append("br");
            control.append("input")
                .attr("type", "range")
                .classed("control-interact", true)
                .on("input", () => {
                var ele = control.select("input").node();
                control.select("label.control-slider-value-text").text(" " + ele.value + " ");
            });
            this.updateSliderControl(control, enabled, label, changedHandler, minValue, maxValue, defaultValue, textAfterValue);
            return control;
        }
        updateSliderControl(control, enabled, label, changedHandler, minValue, maxValue, defaultValue, textAfterValue) {
            this.updateControlItem(control, enabled, label);
            if (minValue != undefined) {
                control.select("input.control-interact").attr("min", minValue);
            }
            if (maxValue != undefined) {
                control.select("input.control-interact").attr("max", maxValue);
            }
            if (changedHandler) {
                control.on("change", () => {
                    var ele = control.select("input.control-interact").node();
                    changedHandler(ele.value);
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node();
                ele.value = defaultValue;
                control.select("label.control-slider-value-text").text(" " + ele.value + " ");
                control.on("change")(ele.value);
            }
            if (textAfterValue != undefined) {
                control.select("label.control-slider-text-after-value").text(textAfterValue);
            }
        }
        generateCheckBoxControl(container, enabled, label, changedHandler, defaultValue) {
            var control = this.generateControlItem(container);
            control.append("label").text(" ");
            control.append("input").attr("type", "checkbox").classed("control-interact", true);
            this.updateCheckBoxControl(control, enabled, label, changedHandler, defaultValue);
            return control;
        }
        updateCheckBoxControl(control, enabled, label, changedHandler, defaultValue) {
            this.updateControlItem(control, enabled, label);
            if (changedHandler) {
                control.on("change", () => {
                    var checked = control.select("input.control-interact").node().checked;
                    changedHandler(checked);
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node();
                ele.checked = defaultValue;
                control.on("change")(ele.checked);
            }
        }
        generateDropDownControl(container, enabled, label, options, changedHandler, defaultValue) {
            var control = this.generateControlItem(container);
            control.append("br");
            control.append("select").classed("control-interact", true);
            this.updateDropDownControl(control, enabled, label, options, changedHandler, defaultValue);
            return control;
        }
        updateDropDownControl(control, enabled, label, options, changedHandler, defaultValue) {
            this.updateControlItem(control, enabled, label);
            if (options) {
                control.select("select.control-interact").selectAll("options").remove();
                control.select("select.control-interact")
                    .selectAll("option")
                    .data(options)
                    .enter()
                    .append("option")
                    .attr("value", d => d)
                    .text(d => d);
            }
            if (changedHandler) {
                control.on("change", () => {
                    let ele = control.select("select.control-interact").node();
                    changedHandler(ele.options[ele.selectedIndex].value);
                });
            }
            if (defaultValue) {
                let ele = control.select("select.control-interact").node();
                ele.value = defaultValue;
                control.on("change")(ele.options[ele.selectedIndex].value);
            }
        }
        generateControlItem(container) {
            var control = container.append("div");
            control.append("label").classed("control-label", true);
            return control;
        }
        updateControlItem(control, enabled, label) {
            if (enabled != undefined) {
                if (enabled) {
                    control.selectAll(".control-interact").attr("disabled", null);
                }
                else {
                    control.selectAll(".control-interact").attr("disabled", true);
                }
            }
            if (label) {
                control.select("label.control-label").text(label);
            }
        }
    }
    ComponentBuilders.ControlPanelBuilder = ControlPanelBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./ComponentBuilderBase.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class FourPartsSplitViewBuilder extends ComponentBuilders.ComponentBuilderBase {
        constructor() {
            super();
            this.setTagName("div");
            this.setClassName("svg-split-view");
        }
        get upper_left_selection() { return this.upper_left; }
        get upper_right_selection() { return this.upper_right; }
        get lower_left_selection() { return this.lower_left; }
        get lower_right_selection() { return this.lower_right; }
        buildExtra() {
            this.generateDivs();
            this.splitDivs();
        }
        splitDivs() {
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
        generateDivs() {
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
    ComponentBuilders.FourPartsSplitViewBuilder = FourPartsSplitViewBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./SvgBuilder.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class TileViewBuilder extends ComponentBuilders.SvgBuilder {
        constructor() {
            super(...arguments);
            this.mouseDown = false;
        }
        buildExtra() {
            super.buildExtra();
            this.mainSelection.style("width", "calc(100% - 100px)");
        }
        imagePathUpdated(path) {
            this.imageDirectoryPath = path;
            if (this.raster) {
                this.raster.selectAll("image").attr("xlink:href", d => d[1] + 1 > Math.pow(2, d[2] + 1) || d[0] + 1 > Math.pow(2, d[2] + 1) ?
                    "" : this.imageDirectoryPath + "/" + (d[2] + 1) + "_" + d[1] + "_" + d[0] + ".png");
            }
        }
        cloneDataSetUpdated(cloneDataSet, selectedRangeUpdatedHandler) {
            this.setSvgSizeAsContainerSize();
            this.setSvgViewBoxSizeBasedOnRealWidthAndHeight();
            this.generateStatistics(cloneDataSet);
            this.generateVisualization(cloneDataSet, selectedRangeUpdatedHandler);
        }
        generateVisualization(cloneDataSet, selectedRangeUpdatedHandler) {
            this.mouseSelection = { start: [0, 0], end: [0, 0] };
            this.tile = this.initializeTileObject();
            this.mouseSelectionRect = this.mainSelection.append("rect").classed("mouse_selection_rect", true);
            this.setSvgZoom();
            this.setCursorAsNone();
            this.setSvgGuideLines();
            this.setSvgPromptText(cloneDataSet);
            this.setSvgRangeSelection(cloneDataSet, selectedRangeUpdatedHandler);
        }
        setSvgRangeSelection(cloneDataSet, selectedRangeUpdatedHandler) {
            this.mouseDown = false;
            this.mainSelection.on("contextmenu", () => d3.event.preventDefault())
                .on("click", () => alert(this.getRelativeCoordinate(d3.mouse(this.mainSelection.node()), this.tile)))
                .on("mousedown.selectRange", this.selectRangeMouseDownHandler())
                .on("mousemove.selectRange", this.selectRangeMouseMoveHandler())
                .on("mouseup.selectRange", this.selectRangeMouseUpHandler(cloneDataSet, selectedRangeUpdatedHandler));
        }
        selectRangeMouseUpHandler(cloneDataSet, selectedRangeUpdatedHandler) {
            return () => {
                if (d3.event.button == 2) {
                    var position = d3.mouse(this.mainSelection.node());
                    this.mouseDown = false;
                    var relativeCoodinate = this.getRelativeCoordinate(position, this.tile);
                    this.mouseSelection.end = relativeCoodinate;
                    var rangedCloneList = [];
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
        selectRangeMouseMoveHandler() {
            return () => {
                var position = d3.mouse(this.mainSelection.node());
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
        selectRangeMouseDownHandler() {
            return () => {
                if (d3.event.button == 2) {
                    var position = d3.mouse(this.mainSelection.node());
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
        setSvgPromptText(cloneDataSet) {
            var promptText = this.mainSelection.append("text");
            this.mainSelection.on("mousemove.promptText", () => {
                var position = d3.mouse(this.mainSelection.node());
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
        setSvgGuideLines() {
            var mouseHorizontalLine = this.mainSelection.append("line").classed("guide-line", true);
            var mouseVerticalLine = this.mainSelection.append("line").classed("guide-line", true);
            this.mainSelection.on("mousemove.guidelines", () => {
                var position = d3.mouse(this.mainSelection.node());
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
        getRelativeCoordinate(position, transformObject) {
            var result = [null, null];
            result[0] = ((position[0] - transformObject.translate()[0]) / transformObject.scale() / 2 + 0.25) / 0.99 - 0.005;
            result[1] = 1 - (((position[1] - transformObject.translate()[1]) / transformObject.scale() / 2 + 0.25)) / 0.99 + 0.005;
            return result;
        }
        getAbsoluteCoordinate(position, transformObject) {
            var result = [null, null];
            result[0] = ((position[0] + 0.005) * 0.99 - 0.25) * 2 * transformObject.scale() + transformObject.translate()[0];
            result[1] = ((1 - position[1] + 0.005) * 0.99 - 0.25) * 2 * transformObject.scale() + transformObject.translate()[1];
            return result;
        }
        setCursorAsNone() {
            this.mainSelection.on("mouseover", () => this.mainSelection.style("cursor", "none"))
                .on("mouseout", () => this.mainSelection.style("cursor", ""));
        }
        setSvgZoom() {
            this.raster = this.mainSelection.insert("g", "rect.mouse_selection_rect")
                .classed("raster", true);
            var zoom = this.initializeZoomObject();
            this.mainSelection.call(zoom)
                .call(zoom.transform, d3.zoomIdentity
                // .translate(64, 0)
                .translate(128, 128)
                .scale(1 << 8));
        }
        setSvgSizeAsContainerSize() {
            this.mainSelection.attr("width", this.containerWidth)
                .attr("height", this.containerHeight);
        }
        initializeZoomObject() {
            return d3.zoom()
                .scaleExtent([1 << 8, 1 << 12])
                .on("zoom", this.zoomed());
        }
        initializeTileObject() {
            return d3.tile()
                .size([this.mainSelection.attr("viewBox").split(" ")[2],
                this.mainSelection.attr("viewBox").split(" ")[2]]);
        }
        setSvgViewBoxSizeBasedOnRealWidthAndHeight() {
            if (this.mainSelectionWidth > this.mainSelectionHeight) {
                this.mainSelection.attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", 0 + " " + 0 + " " + this.svgViewBoxWidth / this.mainSelectionHeight * this.mainSelectionWidth + " " + this.svgViewBoxWidth);
            }
            else {
                this.mainSelection.attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", 0 + " " + 0 + " " + this.svgViewBoxWidth + " " + this.svgViewBoxHeight / this.mainSelectionWidth * this.mainSelectionHeight);
            }
        }
        generateStatistics(cloneDataSet) {
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
                "Type 1: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "1" ? 1 : 0)).reduce((total, num) => total + num),
                "Type 2: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "2" ? 1 : 0)).reduce((total, num) => total + num),
                "Type 3: " + cloneDataSet.cloneList.map(d => (d.sumChangeCount > 0 && d.classType == "3" ? 1 : 0)).reduce((total, num) => total + num)
            ])
                .enter()
                .append("li")
                .style("font-size", "0.7em")
                .style("color", "white")
                .text(d => d);
        }
        zoomed() {
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
        updateImagesZoom(tiles) {
            var image = this.raster
                .attr("transform", this.stringify(tiles.scale, tiles.translate))
                .selectAll("image")
                .data(tiles, (d) => d);
            image.exit().remove();
            image.enter().append("image")
                .attr("xlink:href", (d) => {
                return d[1] + 1 > Math.pow(2, d[2] + 1) || d[0] + 1 > Math.pow(2, d[2] + 1) ?
                    "" : this.imageDirectoryPath + "/" + (d[2] + 1) + "_" + d[1] + "_" + d[0] + ".png";
            })
                .attr("x", (d) => d[0] * 256)
                .attr("y", (d) => d[1] * 256)
                .attr("width", 256)
                .attr("height", 256);
        }
        updateTilesZoom(transform) {
            return this.tile
                .scale(transform.k)
                .translate([transform.x, transform.y])();
        }
        stringify(scale, translate) {
            var k = scale / 256, r = scale % 1 ? Number : Math.round;
            return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
        }
    }
    ComponentBuilders.TileViewBuilder = TileViewBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
var Models;
(function (Models) {
    class CloneClass {
    }
    Models.CloneClass = CloneClass;
    class CloneFile {
    }
    Models.CloneFile = CloneFile;
    class CloneInstance {
    }
    Models.CloneInstance = CloneInstance;
    class SupportCountMap {
    }
    Models.SupportCountMap = SupportCountMap;
    class SystemInfo {
    }
    Models.SystemInfo = SystemInfo;
    class CloneDataSet {
    }
    Models.CloneDataSet = CloneDataSet;
})(Models || (Models = {}));
/// <reference path="./SvgBuilder.ts" />
/// <reference path="../Models/CloneDataSet.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class ForceLayoutBuilder extends ComponentBuilders.SvgBuilder {
        buildExtra() {
            super.buildExtra();
            this.mainSelection.classed("main", true);
            this.mainSelection.style("width", "calc(100% - 100px)");
            this.mainSelection.append("g")
                .classed("context-menu", true);
            this.mainSelection.on("click", () => this.mainSelection.select("g.context-menu").selectAll("*").remove());
            this.mainSelection.insert("rect", "g.context-menu")
                .classed("zoom-background", true)
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 99999)
                .attr("height", 99999)
                .attr("fill", "transparent");
            this.mainSelection.select(".zoom-background").call(d3.zoom().on("zoom", () => {
                this.mainSelection.select(".zoomable-g").attr("transform", d3.event.transform);
            }));
            this.mainSelection.insert("g", "g.context-menu").classed("zoomable-g", true);
            this.container.append("div")
                .classed("statistics-box", true)
                .style("float", "right")
                .style("width", "100px")
                .style("height", "calc(100% - 100px)")
                .style("background-color", "gray")
                .style("overflow-y", "auto");
        }
        nodeHighlightUpdated(highlightPredicate) {
            var nodeSelection = this.mainSelection.selectAll(".zoomable-g g.node").selectAll("circle, path");
            nodeSelection.attr("stroke-width", (d) => highlightPredicate(d.reference) ? "3px" : "1px");
            var data = nodeSelection.data();
            nodeSelection.attr("opacity", (d) => {
                if (data.find((da) => highlightPredicate(da.reference))) {
                    return highlightPredicate(d.reference) ? 1 : .5;
                }
                else {
                    return 1;
                }
            });
            var edgeSelection = this.mainSelection.selectAll(".zoomable-g g.edge").selectAll("line");
            edgeSelection.attr("opacity", (d) => {
                var highlightedList = data.filter((da) => highlightPredicate(da.reference));
                if (highlightedList.length > 0) {
                    return this.edgeOpacityScale(d.weight) *
                        (highlightedList.find((da) => da == d.source) &&
                            highlightedList.find((da) => da == d.target) ?
                            1 : .5);
                }
                else {
                    return this.edgeOpacityScale(d.weight);
                }
            });
        }
        nodeShapeUpdated(shapeGetter, sizeGetter, nodeHoverHandler, nodeDragHandler, contextMenuItemList) {
            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);
            var svgSelection = this.mainSelection;
            var nodeSelection = this.mainSelection.selectAll(".zoomable-g g.node");
            nodeSelection.selectAll("*").remove();
            nodeSelection.append("path")
                .attr("d", d3.symbol().type((d) => d3.symbols[shapeGetter(d.reference)]).size((d) => Math.pow(sizeGetter(d.reference), 2)))
                .attr("fill", (d) => colors(d.module).toString())
                .attr("stroke", "black")
                // .attr("stroke-width", () => d.border ? "3px" : "1px")
                .attr("draggable", true)
                .on("dragstart", (d) => nodeDragHandler(d.reference))
                .on("contextmenu", (d) => {
                d3.event.preventDefault();
                var mousePosition = d3.mouse(svgSelection.node());
                var width = 200;
                var height = 200;
                var displayX = mousePosition[0] + width < this.svgViewBoxWidth ? mousePosition[0] : mousePosition[0] - width;
                var displayY = mousePosition[1] + height < this.svgViewBoxHeight ? mousePosition[1] : mousePosition[1] - height;
                this.mainSelection.select("g.context-menu").selectAll("*").remove();
                this.mainSelection.select("g.context-menu")
                    .attr("transform", "translate(" + displayX + "," + displayY + ")")
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", width)
                    .attr("height", height)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", "azure")
                    .attr("opacity", .85);
                for (const menuItem of contextMenuItemList) {
                    this.generateContextMenuItem(menuItem.index, menuItem.text, () => menuItem.clickHandler(d.reference));
                }
            })
                .on("mouseover", (d) => nodeHoverHandler(d.reference))
                .on("mouseout", () => nodeHoverHandler(null))
                .append("title").text((d) => d.id);
        }
        generateContextMenuItem(index, text, clickHandler, datum) {
            this.mainSelection.select("g.context-menu")
                .append("text")
                .datum(datum)
                .attr("x", 5)
                .attr("y", 20 + index * 25)
                .style("cursor", "pointer")
                .text(text)
                .on("click", clickHandler);
        }
        nodeColorUpdated(colorGetter) {
            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);
            this.mainSelection.selectAll(".zoomable-g g.node").selectAll("path, circle")
                .attr("fill", (d) => colorGetter(d.reference) ? colorGetter(d.reference) : colors(d.module).toString());
        }
        edgeListUpdated(cloneList, statisticsTextList, primaryItemGetter, secondaryItemGetter, nodeSizeGetter, specialEdgeListGetter) {
            this.currentCloneList = cloneList;
            this.mainSelection.select(".zoomable-g").selectAll("*").remove();
            var primaryItemMap = this.generatePrimaryItemMap(cloneList, primaryItemGetter, secondaryItemGetter);
            var edgeList;
            if (specialEdgeListGetter) {
                edgeList = specialEdgeListGetter();
            }
            else {
                edgeList = this.generateEdgeList(primaryItemMap);
            }
            var nodeList = Array.from(primaryItemMap.entries()).map(d => { return { name: d[0], count: d[1].count, reference: d[1].reference }; });
            var nodeHash = {};
            var nodes = [];
            var edges = [];
            for (const node of nodeList) {
                var n;
                nodeHash[node.name] = { id: node.name, label: node.name, reference: node.reference };
                n = nodeHash[node.name];
                n.count = node.count;
                nodes.push(n);
            }
            for (const edge of edgeList) {
                edges.push({
                    id: nodeHash[edge.source].id + "-" + nodeHash[edge.target].id,
                    source: nodeHash[edge.source],
                    target: nodeHash[edge.target],
                    weight: edge.weight
                });
            }
            // for (const edge of edges) {
            //     if (!nodeHash[edge.source]) {
            //         nodeHash[edge.source] = { id: edge.source, label: edge.source };
            //         nodes.push(nodeHash[edge.source]);
            //     }
            //     if (!nodeHash[edge.target]) {
            //         nodeHash[edge.target] = { id: edge.target, label: edge.target };
            //         nodes.push(nodeHash[edge.target]);
            //     }
            //     if (edge.weight == 4) {
            //         edgeList.push({ id: nodeHash[edge.source].id + "-" + nodeHash[edge.target].id, source: nodeHash[edge.source], target: nodeHash[edge.target], weight: edge.weight });
            //     }
            // }
            this.container.select("div.statistics-box").selectAll("*").remove();
            this.container.select("div").append("ul")
                .style("list-style-type", "none")
                .style("padding", "1px")
                .selectAll("li")
                .data(statisticsTextList)
                .enter()
                .append("li")
                .style("font-size", "0.7em")
                .style("color", "white")
                .text(d => d);
            this.createForceNetwork(edges, nodes, nodeSizeGetter);
        }
        createForceNetwork(edges, nodes, nodeSizeGetter) {
            this.edgeOpacityScale = d3.scalePow()
                .domain([Math.max(...edges.map(d => d.weight)), Math.min(...edges.map(d => d.weight))])
                .range([1, 0.1]);
            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);
            var node_data = nodes.map(function (d) { return d.id; });
            var edge_data = edges.map(function (d) { return { source: d.source.id, target: d.target.id, weight: 1 }; });
            // var str = "source, target, weight\n";
            // for (const edge of edges) {
            //     str += edge.source.id + ", " + edge.target.id + ", " + edge.weight + "\n";
            // }
            // console.log(str)
            var result = {};
            if (edge_data.length > 0) {
                var community = jLouvain().nodes(node_data).edges(edge_data);
                result = community();
            }
            else {
                for (var id in node_data) {
                    result[id] = 0;
                }
            }
            for (const node of nodes) {
                node.module = result[node.id];
            }
            var modularityGraph = this.modularityCensus(edges, nodes);
            if (this.secondarySelection)
                this.secondarySelection.remove();
            this.secondarySelection = this.container.append("svg")
                .attr("class", "modularity")
                .attr("height", 100)
                .attr("width", 100)
                .style("height", 100)
                .style("width", 100)
                .style("display", "block")
                .style("float", "right")
                .style("margin-top", "-100px")
                // .style("position", "relative")
                // .style("left", (this.container.node() as any).getBoundingClientRect().width - 110)
                // .style("top", (this.container.node() as any).getBoundingClientRect().height - 110)
                .style("background", "white");
            this.secondarySelection.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 100)
                .attr("height", 100)
                .attr("fill", "transparent")
                .attr("stroke", "black");
            // this.secondarySelection.selectAll("line")
            //     .data(modularityGraph.edges)
            //     .enter()
            //     .append("line")
            //     .attr("class", "modularity")
            //     .style("stroke-width", function (d) { return d.weight * 2 })
            //     .style("stroke", "black");
            this.secondarySelection.selectAll("circle")
                .data(modularityGraph.nodes.filter(function (d) { return d.members.length > 1; }).filter(d => d.id != "singletons"))
                .enter()
                .append("circle")
                .attr("class", "modularity")
                .attr("r", function (d) { return d.members.length; })
                .attr("stroke", "black")
                .attr("stroke-width", "1px")
                .attr("fill", function (d) { return d.id == "singletons" ? "lightgray" : colors(d.id).toString(); })
                .attr("opacity", .5);
            // .on("mouseover", moduleOver(this.mainSelection))
            // .on("mouseout", moduleOut(this.mainSelection));
            var force = d3.forceSimulation()
                .force("link", d3.forceLink().id((d) => d.id))
                .force("collide", d3.forceCollide((d) => nodeSizeGetter(d.reference)))
                .force("center", d3.forceCenter(this.svgViewBoxWidth / 2, this.svgViewBoxHeight / 2))
                .force("charge", d3.forceManyBody())
                .force("y", d3.forceY(0))
                .force("x", d3.forceX(0))
                .nodes(nodes)
                // .on("tick", this.updateNetwork);
                .on("tick", () => {
                this.mainSelection.select(".zoomable-g").selectAll("line")
                    .attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });
                this.mainSelection.select(".zoomable-g").selectAll("g.node")
                    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
                this.secondarySelection.selectAll("circle")
                    .each(function (d) {
                    var theseNodes = d.members;
                    var avgX = d3.mean(theseNodes, function (p) { return p.x; });
                    var avgY = d3.mean(theseNodes, function (p) { return p.y; });
                    d.x = avgX / 5;
                    d.y = avgY / 5;
                })
                    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
                this.secondarySelection.selectAll("line")
                    .attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });
            });
            force.force("link")
                .links(edges);
            // var force = d3.forceSimulation().nodes(nodes).links(edges)
            //     .size([500, 500])
            //     .charge(-300)
            //     .gravity(0.2)
            //     .on("tick", updateNetwork);
            var edgeEnter = this.mainSelection.select(".zoomable-g").selectAll("g.edge")
                .data(edges, function (d) { return d.id; })
                .enter()
                .append("g")
                .attr("class", "edge");
            edgeEnter
                .append("line")
                .attr("stroke-width", function (d) { return d.border ? "3px" : "1px"; })
                .attr("opacity", d => this.edgeOpacityScale(d.weight))
                .attr("stroke", "black")
                .attr("pointer-events", "none");
            var nodeEnter = this.mainSelection.select(".zoomable-g").selectAll("g.node")
                .data(nodes, function (d) { return d.id; })
                .enter()
                .append("g")
                .attr("class", "node");
            // .call(force.drag());
            nodeEnter.append("circle")
                .attr("r", 8)
                .attr("fill", function (d) { return colors(d.module).toString(); })
                .attr("stroke", "black")
                .attr("stroke-width", function (d) { return d.border ? "3px" : "1px"; })
                .attr("draggable", true)
                .on("dragstart", d => {
                d3.event.dataTransfer.setData("filepath", d.id.replace("/Users/avigitsaha/Google_Drive/by_language/Java/5-Terasology-develop", "data_files"));
            });
            nodeEnter.append("title").text(d => d.id);
            function moduleOver(mainSelection) {
                return function (d) {
                    console.log("MODULE", d);
                    d3.select(this)
                        .style("stroke-width", "4px");
                    mainSelection.selectAll("path, circle")
                        .style("stroke-width", function (p) { return p.module == d.id ? "4px" : "1px"; });
                };
            }
            function moduleOut(mainSelection) {
                return function (d) {
                    d3.select(this)
                        .style("stroke-width", "1px");
                    mainSelection.selectAll("path, circle")
                        .style("stroke-width", "1px");
                };
            }
        }
        nodeSelectedOpenNewTabsHandler(mode, nodeSelectedCloneListGetter) {
            return (d) => {
                var clones = nodeSelectedCloneListGetter(mode, d.reference);
                Utilities.openCloneInstanceDetailInNewTabs(clones);
            };
        }
        modularityCensus(edges, nodes) {
            for (const edge of edges) {
                if (edge.source.module !== edge.target.module) {
                    edge["border"] = false; //sean: was true before
                }
                else {
                    edge["border"] = false;
                }
            }
            for (const node of nodes) {
                var theseEdges = edges.filter(function (d) { return d.source === node || d.target === node; });
                var theseSourceModules = theseEdges.map(function (d) { return d.source.module; }).filter(this.onlyUnique);
                var theseTargetModules = theseEdges.map(function (d) { return d.target.module; }).filter(this.onlyUnique);
                if (theseSourceModules.length > 1 || theseTargetModules.length > 1) {
                    node.border = true;
                }
                else {
                    node.border = false;
                }
            }
            var modules = nodes.map(d => d.module)
                .filter(this.onlyUnique)
                .map(function (d) { return { id: d, members: [] }; });
            var moduleEdges = [];
            var singletons = { id: "singletons", members: [] };
            var moduleNodeHash = {};
            for (const module of modules) {
                module.members = nodes.filter(d => d.module === module.id);
                moduleNodeHash[module.id] = module;
                if (module.members.length === 1) {
                    singletons.members.push(module.members[0]);
                }
            }
            modules.push(singletons);
            var moduleEdgeHash = {};
            for (const edge of edges) {
                if (!moduleEdgeHash[moduleNodeHash[edge.source.module].id + "-" + moduleNodeHash[edge.target.module].id]) {
                    var moduleEdge = { source: moduleNodeHash[edge.source.module], target: moduleNodeHash[edge.target.module], weight: 1 };
                    moduleEdgeHash[moduleNodeHash[edge.source.module].id + "-" + moduleNodeHash[edge.target.module].id] = moduleEdge;
                    moduleEdges.push(moduleEdge);
                }
                else {
                    moduleEdgeHash[moduleNodeHash[edge.source.module].id + "-" + moduleNodeHash[edge.target.module].id].weight += 1;
                }
            }
            return { nodes: modules, edges: moduleEdges };
        }
        onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        generateEdgeList(primaryItemMap) {
            var edgeList = [];
            for (let i = 0; i < primaryItemMap.size; i++) {
                for (let j = i + 1; j < primaryItemMap.size; j++) {
                    let entries = Array.from(primaryItemMap.entries());
                    let key1 = entries[i][0];
                    let key2 = entries[j][0];
                    let value1 = entries[i][1];
                    let value2 = entries[j][1];
                    let intersetion = new Set([...(value1.secondaryItemSet)]
                        .filter(x => value2.secondaryItemSet.has(x)));
                    // if(true){
                    if (intersetion.size > 0) {
                        edgeList.push({ source: key1, target: key2, weight: intersetion.size, border: undefined });
                    }
                }
            }
            return edgeList;
        }
        generatePrimaryItemMap(cloneList, primaryItemGetter, secondaryItemGetter) {
            var primaryItemMap = new Map();
            for (const clone of cloneList) {
                if (primaryItemMap.has(primaryItemGetter(clone))) {
                    var primaryItem = primaryItemMap.get(primaryItemGetter(clone));
                    primaryItem.count++;
                    primaryItem.secondaryItemSet.add(secondaryItemGetter(clone));
                }
                else {
                    primaryItemMap.set(primaryItemGetter(clone), {
                        count: 1,
                        reference: clone,
                        secondaryItemSet: new Set().add(secondaryItemGetter(clone))
                    });
                }
            }
            return primaryItemMap;
        }
    }
    ComponentBuilders.ForceLayoutBuilder = ForceLayoutBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./ComponentBuilderBase.ts" />
var ComponentBuilders;
(function (ComponentBuilders) {
    class HeatmapBuilder extends ComponentBuilders.SvgBuilder {
        constructor() {
            super(...arguments);
            this.selectedCells = [];
            this.currentData = [];
            this.mouseDown = false;
            this.selectedRect = { start: undefined, end: undefined };
            this.getCellColorBySelection = data => {
                return this.selectedCells.find(d => (d.idX == data.idX && d.idY == data.idY) || (d.idX == data.idY && d.idY == data.idX)) ?
                    this.selectionColorScale(data.value) :
                    this.normalColorScale(data.value);
            };
            this.cellSelectedHandler = d => {
                this.appendItemToSelectedCells(d);
                this.updateViewWhenCellSelectionChanged();
            };
        }
        buildExtra() {
            super.buildExtra();
            this.mainSelection.style("width", "calc(100% - 100px)");
            this.generateCellSelectionListBox();
            this.mainSelection.append("g").classed("zoomable-g", true);
            this.mainSelection.call(d3.zoom().on("zoom", () => {
                this.mainSelection.select("g.zoomable-g").attr("transform", d3.event.transform);
            }));
        }
        appendItemToSelectedCells(d) {
            if (this.selectedCells.find(da => (da.idX == d.idX && da.idY == d.idY) || (da.idX == d.idY && da.idY == d.idX))) {
                this.selectedCells.splice(this.selectedCells.findIndex(da => (da.idX == d.idX && da.idY == d.idY) || (da.idX == d.idY && da.idY == d.idX)), 1);
            }
            else {
                this.selectedCells.push(d);
            }
        }
        updateViewWhenCellSelectionChanged() {
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
                    .filter((dat) => (dat.idX == da.idX && dat.idY == da.idY) || (dat.idX == da.idY && dat.idY == da.idX))
                    .remove();
            });
            this.updateCellColorsBySelection();
        }
        updateHighlight(cloneList) {
            this.rectangles.attr("stroke-width", (d) => cloneList.find(c => c == d.referenceX || c == d.referenceY) ? 1 : 0);
        }
        dataUpdated(data, count, cellSelectedCloneListGetter, reduceCloneSelectionHandler) {
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
                    var filteredData = this.currentData
                        .filter((d) => d.x >= rect.minX && d.x <= rect.maxX && d.y >= rect.minY && d.y <= rect.maxY);
                    filteredData = filteredData.filter((d, i) => i == filteredData.findIndex(da => (d.idX == da.idX && d.idY == da.idY) || (d.idX == da.idY && d.idY == da.idX)));
                    for (const d of filteredData) {
                        this.appendItemToSelectedCells(d);
                    }
                    this.updateViewWhenCellSelectionChanged();
                }
            });
        }
        generateCellSelectionListBox() {
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
                .style("height", "100px");
            buttonsBox.append("button")
                .style("width", "100%")
                .text("evolution")
                .on("click", () => {
                var chainList = this.selectedCells.map(d => {
                    var typeX = d.idX.split(":")[0];
                    var idX = d.idX.split("@")[1];
                    return { type: typeX, id: idX, associatingCloneId: d.referenceX.id };
                });
                chainList.push(...this.selectedCells.map(d => {
                    var typeY = d.idY.split(":")[0];
                    var idY = d.idY.split("@")[1];
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
        updateCellColorsBySelection() {
            this.rectangles.attr("fill", dat => this.getCellColorBySelection(dat));
        }
        appendTitlesToRectangels() {
            this.rectangles.append("title").text(d => "(" + d.idX + ", " + d.idY + ") => " + d.value);
        }
        generateRectangles(rectangleSize) {
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
        getColorScale(range) {
            var colorDomain = d3.extent(this.currentData, d => d.value);
            var colorScale = d3.scaleLinear()
                .domain(colorDomain)
                .range(range);
            return colorScale;
        }
    }
    ComponentBuilders.HeatmapBuilder = HeatmapBuilder;
})(ComponentBuilders || (ComponentBuilders = {}));
/// <reference path="./CloneDataSet.ts" />
var Models;
(function (Models) {
    class MainModel {
        constructor() {
            this.selectedCloneList = [];
            this.cloneDataSet = new Models.CloneDataSet();
            this.forceLayoutNodeDragHandler = (clone) => {
                if (this.fragmentViewNodeType != "class") {
                    var lineNumbers = this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(clone);
                    d3.event.dataTransfer.setData("fileInfo", JSON.stringify({
                        path: clone.filePath,
                        highlight: lineNumbers
                    }));
                }
            };
            this.controlPanelFileViewEdgeTypeUpdatedHandler = (edgeType) => {
                this.fileViewEdgeType = edgeType;
                this.updateFileView();
            };
            this.controlPanelSearchCloneHandler = (query) => {
                try {
                    let querySplit_1 = query.split(",");
                    this.selectedCloneList = [];
                    for (const q of querySplit_1) {
                        let querySplit_2 = q.split("|");
                        if (querySplit_2[0]) {
                            let querySplit_3 = querySplit_2[0].split(":");
                            let selectionList = [];
                            selectionList = this.cloneDataSet.cloneList.filter(d => d.classType == querySplit_3[0]);
                            if (querySplit_3[1]) {
                                selectionList = selectionList.filter(d => d.classId == +querySplit_3[1]);
                            }
                            if (querySplit_3[2]) {
                                selectionList = selectionList.filter(d => d.id == +querySplit_3[2]);
                            }
                            this.selectedCloneList.push(...selectionList);
                        }
                        if (querySplit_2[1]) {
                            if (this.selectedCloneList.length == 0) {
                                this.selectedCloneList = this.cloneDataSet.cloneList;
                            }
                            this.selectedCloneList = this.selectedCloneList.filter(d => d.filePath.search(querySplit_2[1]) >= 0);
                        }
                    }
                    this.selectedCloneList.filter((d, i) => i == this.selectedCloneList.findIndex(da => da == d));
                    this.updateSelectedCloneList();
                    return "Queried " + this.selectedCloneList.length + " clones.";
                }
                catch (e) {
                    return e;
                }
            };
            this.heatmapViewReduceCloneSelectionHandler = (chainList) => {
                var newList = [];
                for (const chain of chainList) {
                    var type = chain.split(":")[0];
                    var id = chain.split("@")[1];
                    var index = this.selectedCloneList.findIndex(d => type == d.classType && id == d.chainId);
                    if (index >= 0) {
                        newList.push(...this.selectedCloneList.splice(index, 1));
                    }
                }
                this.selectedCloneList = newList;
                this.updateSelectedCloneList();
            };
            this.fragmentViewNodeSelectedCloneListGetter = (mode, clone) => {
                switch (mode) {
                    case "single":
                        return [clone];
                    case "directory":
                        return this.cloneListToShow.filter(d => d.DC == clone.DC);
                    case "class":
                        return this.cloneListToShow.filter(d => d.classType == clone.classType && d.classId == clone.classId);
                }
            };
            this.fileViewNodeHoveredHandler = (clone) => {
                this.updateFragmentViewNodeHighlight(clone);
                this.updateHeatmapViewCellHighlight(clone, c => c ? this.cloneListToShow.filter(d => d.filePath == c.filePath) : []);
            };
            this.isSummaryViewShowingContourUpdatedHandler = (isShowing) => {
                this.summaryViewBuilder.imagePathUpdated("tiles/" + (isShowing ? "contour" : "plain"));
            };
            this.fragmentViewNodeHoveredHandler = (clone) => {
                this.updateFileViewNodeHighlight(clone);
                this.updateHeatmapViewCellHighlight(clone, c => {
                    if (clone) {
                        switch (this.fragmentViewNodeType) {
                            case "class":
                                return this.cloneListToShow.filter(d => d.classType == c.classType && d.classId == c.classId);
                            case "clone fragment":
                                return [clone];
                        }
                    }
                    else {
                        return [];
                    }
                });
            };
            this.addAllClonesFromSameClassIntoSelectedClonesRequestedHandler = (classType, classId) => {
                for (const clone of this.cloneDataSet.cloneList) {
                    if (clone.classType == classType && clone.classId == classId && !this.selectedCloneList.find(d => d == clone)) {
                        this.selectedCloneList.push(clone);
                    }
                }
                this.updateFragmentView();
                this.updateFileView();
            };
            this.maxSelectionLimitationByChangeCountUpdatedHandler = (limit) => {
                this.maxSelectionLimitationByChangeCount = limit;
                this.updateSelectedCloneList();
            };
            this.selectionFilterLowerLimitBySupportCountUpdatedHandler = (max) => {
                this.selectionFilterLowerLimitBySupportCount = max;
                this.updateSelectedCloneList();
            };
            this.isShowingOnlyTheLastRevisionUpdatedHandler = (isShowing) => {
                this.isShowingOnlyLastRevision = isShowing;
                this.updateFragmentView();
                this.updateFileView();
            };
            this.fragmentViewNodeColorUpdatedHandler = (byWhat) => {
                if (byWhat) {
                    this.fragmentViewNodeColorBy = byWhat;
                }
                this.updateFragmentViewNodeColor();
            };
            this.fileViewNodeColorUpdatedHandler = (byWhat) => {
                if (byWhat) {
                    this.fileViewNodeColorBy = byWhat;
                }
                this.updateFileViewNodeColor();
            };
            this.fragmentViewNodeTypeUpdatedHandler = (nodeType) => {
                this.fragmentViewNodeType = nodeType;
                if (nodeType == "clone fragment") {
                    this.controlPanelBuilder.updateFragmentViewNodeColorControl(true, "automatic");
                    this.controlPanelBuilder.updateFragmentViewEdgeTypeControl(true, "class");
                }
                else {
                    this.controlPanelBuilder.updateFragmentViewNodeColorControl(false, "automatic");
                    this.controlPanelBuilder.updateFragmentViewEdgeTypeControl(false, "file");
                }
                this.updateFragmentView();
            };
            this.fragmentViewEdgeTypeUpdatedHandler = (edgeType) => {
                this.fragmentViewEdgeType = edgeType;
                this.updateFragmentView();
            };
            this.selectedCloneListUpdatedHandler = (selectedCloneList) => {
                if (selectedCloneList) {
                    this.selectedCloneList = selectedCloneList;
                }
                this.updateSelectedCloneList();
            };
            this.heatmapViewCellSelectedCloneListGetter = (ids) => {
                return this.cloneListToShow.filter(d => ids.find(da => da == d.classType + ":" + d.chainId));
            };
            this.cloneCountInFileGetter = clone => {
                return this.cloneListToShow.filter(c => c.filePath == clone.filePath).length;
            };
            this.ScaledcloneCountInFileGetter = d => {
                return this.cloneCountInFileScale(this.cloneCountInFileGetter(d));
            };
        }
        get cloneListToShow() {
            var temp = this.isShowingOnlyLastRevision ?
                this.selectedCloneList.filter(d => d.finalRevision == this.cloneDataSet.systemInfo.finalRevision) : this.selectedCloneList;
            temp = temp.filter(d => {
                var map = this.cloneDataSet.supportCountMap.types[d.classType].supportCounts[d.chainId];
                var max = 0;
                if (map) {
                    max = Math.max(...Object.keys(map).map((key) => map[key]));
                }
                return max >= this.selectionFilterLowerLimitBySupportCount;
            });
            temp = temp.sort((a, b) => b.sumChangeCount - a.sumChangeCount)
                .slice(0, this.maxSelectionLimitationByChangeCount);
            return temp;
        }
        get maxSumChangeCount() {
            return Math.max(...this.cloneDataSet.cloneList.map(d => d.sumChangeCount));
        }
        get cloneCountInFileScale() {
            var reducedCloneList = this.cloneListToShow.filter((d, i) => i == this.cloneListToShow.findIndex(c => c.filePath == d.filePath));
            var domainList = reducedCloneList.map(d => this.cloneListToShow.filter(c => c.filePath == d.filePath).length);
            return d3.scaleLinear()
                .domain([Math.min(...domainList), Math.max(...domainList)])
                .range([10, 30]);
        }
        CloneCommunityViewStatisticsTextList(cloneList) {
            var nodeType;
            switch (this.fragmentViewNodeType) {
                case "class":
                    nodeType = "Class";
                    break;
                case "clone fragment":
                    nodeType = "clone fragment";
                    break;
            }
            return [
                "CLONE COM.",
                "Node: " + this.fragmentViewNodeType,
                "Edge: " + this.fragmentViewEdgeType,
                "Node Count: " + cloneList.length,
                "---------------",
                "Type 1: " + cloneList.filter(d => d.classType == "1").length,
                "Type 2: " + cloneList.filter(d => d.classType == "2").length,
                "Type 3: " + cloneList.filter(d => d.classType == "3").length,
                "Σ changes: " + cloneList.map(d => d.sumChangeCount).reduce((prev, curr) => +prev + +curr, 0),
                "Σ supports: " + this.calculateSumSupportCount(cloneList)
            ];
        }
        FileCommunityViewStatisticsTextList(cloneList) {
            return [
                "File COM.",
                "Node: file",
                "Edge: class",
                "Node Count: " + cloneList.length
            ];
        }
        getLineNumberListForFileWithinSelctedRangeFromSingleClone(clone) {
            var clonesInSameFile = this.cloneListToShow.filter(d => d.filePath == clone.filePath);
            var lineNumbers = this.getLineNumberListForFileFromClones(clonesInSameFile);
            return lineNumbers;
        }
        getLineNumberListForFileFromClones(clonesInSameFile) {
            var lineNumbers = new Set();
            for (const clone of clonesInSameFile) {
                for (var i = clone.startLine; i <= clone.endLine; i++) {
                    lineNumbers.add(i);
                }
            }
            return Array.from(lineNumbers);
        }
        updateFragmentViewNodeHighlight(clone) {
            this.fragmentViewBuilder.nodeHighlightUpdated(d => (clone ? d.filePath == clone.filePath : false));
        }
        updateHeatmapViewCellHighlight(clone, cloneListGetter) {
            heatmapView.updateHighlight(cloneListGetter(clone));
        }
        updateFileViewNodeHighlight(clone) {
            this.fileViewBuilder.nodeHighlightUpdated(d => (clone ? d.filePath == clone.filePath : false));
        }
        updateFragmentViewNodeColor() {
            switch (this.fragmentViewNodeColorBy) {
                case "automatic":
                    this.fragmentViewBuilder.nodeColorUpdated(d => null);
                    break;
                case "directory":
                    this.fragmentViewBuilder.nodeColorUpdated(d => d.DC);
                    break;
                case "class":
                    this.fragmentViewBuilder.nodeColorUpdated(d => d.CC);
                    break;
            }
        }
        updateFileViewNodeColor() {
            switch (this.fileViewNodeColorBy) {
                case "automatic":
                    this.fileViewBuilder.nodeColorUpdated(d => null);
                    break;
                case "directory":
                    this.fileViewBuilder.nodeColorUpdated(d => d.DC);
                    break;
            }
        }
        updateSelectedCloneList() {
            this.updateFragmentView();
            this.updateFileView();
            this.updateHeatmap();
        }
        updateHeatmap() {
            var data = [];
            var cloneChains = this.cloneListToShow
                .map(d => { return { chainId: d.classType + ":" + d.classId + ":" + d.id + "@" + d.chainId, reference: d }; });
            cloneChains = cloneChains.filter((d, i) => cloneChains.findIndex(it => it.chainId == d.chainId) == i)
                .sort((a, b) => {
                var aSplit = a.chainId.split(":");
                var bSplit = b.chainId.split(":");
                var aType = +aSplit[0];
                var bType = +bSplit[0];
                var aId = +aSplit[1];
                var bId = +bSplit[1];
                if (aType == bType) {
                    return bId - aId;
                }
                else {
                    return bType - aType;
                }
            });
            for (let i = 0; i < cloneChains.length; i++) {
                for (let j = 0; j < cloneChains.length; j++) {
                    let idX = cloneChains[i].chainId;
                    let idY = cloneChains[j].chainId;
                    let referenceX = cloneChains[i].reference;
                    let referenceY = cloneChains[j].reference;
                    let val;
                    try {
                        val = this.cloneDataSet.supportCountMap.types[idX.split(":")[0]].supportCounts[idX.split("@")[1]][idY.split("@")[1]];
                    }
                    catch (_a) { }
                    data.push({
                        x: i,
                        y: j,
                        idX: idX,
                        idY: idY,
                        value: val ? val : 0,
                        referenceX: referenceX,
                        referenceY: referenceY
                    });
                }
            }
            this.heatmapViewBuilder.dataUpdated(data, cloneChains.length, this.heatmapViewCellSelectedCloneListGetter, this.heatmapViewReduceCloneSelectionHandler);
        }
        updateFileView() {
            var reducedCloneList = this.cloneListToShow.filter((d, i) => i == this.cloneListToShow.findIndex(da => da.filePath == d.filePath));
            var primaryPropertyGetter = (d) => d.filePath + " >> " + this.cloneCountInFileGetter(d);
            var secondaryPropertyGetter;
            var specialEdgeListGetter;
            switch (this.fileViewEdgeType) {
                case "class":
                    secondaryPropertyGetter = d => d.classType + ":" + d.classId;
                    break;
                case "support count":
                    secondaryPropertyGetter = d => d;
                    specialEdgeListGetter = () => {
                        var edgeList = [];
                        this.iterateSupportCountsForCloneList(this.cloneListToShow, (cloneA, cloneB, supportCount) => {
                            var edge = edgeList.find(d => (d.source == primaryPropertyGetter(cloneA) && d.target == primaryPropertyGetter(cloneB)) ||
                                (d.target == primaryPropertyGetter(cloneA) && d.source == primaryPropertyGetter(cloneB)));
                            if (cloneA.filePath != cloneB.filePath) {
                                if (edge) {
                                    edge.weight = Math.max(edge.weight, supportCount);
                                }
                                else {
                                    edgeList.push({ source: primaryPropertyGetter(cloneA), target: primaryPropertyGetter(cloneB), weight: supportCount });
                                }
                            }
                        });
                        edgeList.filter(d => d.weight >= this.selectionFilterLowerLimitBySupportCount);
                        return edgeList;
                    };
                    break;
            }
            this.fileViewBuilder.edgeListUpdated(reducedCloneList, this.FileCommunityViewStatisticsTextList(reducedCloneList), primaryPropertyGetter, secondaryPropertyGetter, this.ScaledcloneCountInFileGetter, specialEdgeListGetter);
            this.fileViewBuilder.nodeShapeUpdated(() => 0, this.ScaledcloneCountInFileGetter, this.fileViewNodeHoveredHandler, this.forceLayoutNodeDragHandler, [
                { index: 0, text: "show source in panel 1", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(1, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) },
                { index: 1, text: "show source in panel 2", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(2, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) },
                { index: 2, text: "show source in panel 3", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(3, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) }
            ]);
            this.fileViewNodeColorUpdatedHandler(null);
        }
        updateFragmentView() {
            var sortedCloneList = [];
            var secondaryPropertyGetter;
            var specialEdgeListGetter;
            const FRAGMENT_LABEL_GETTER = (d) => d.classType + ":" + d.classId + ":" + d.id;
            switch (this.fragmentViewEdgeType) {
                case "class":
                    secondaryPropertyGetter = d => d.classType + ":" + d.classId;
                    break;
                case "file":
                    secondaryPropertyGetter = d => d.filePath;
                    break;
                case "support count":
                    secondaryPropertyGetter = d => d;
                    specialEdgeListGetter = () => {
                        var edgeList = [];
                        this.iterateSupportCountsForCloneList(this.cloneListToShow, (cloneA, cloneB, supportCount) => edgeList.push({ source: FRAGMENT_LABEL_GETTER(cloneA), target: FRAGMENT_LABEL_GETTER(cloneB), weight: supportCount }));
                        return edgeList;
                    };
                    break;
            }
            switch (this.fragmentViewNodeType) {
                case "class":
                    sortedCloneList = this.cloneListToShow
                        .filter((d, i) => i == this.cloneListToShow.findIndex(c => c.classType == d.classType && c.classId == d.classId));
                    // .sort((a, b) =>
                    //     this.cloneDataSet.classList.find(d => d.type == b.classType && d.id == b.classId).cloneCount -
                    //     this.cloneDataSet.classList.find(d => d.type == a.classType && d.id == a.classId).cloneCount
                    // );
                    this.fragmentViewBuilder.edgeListUpdated(sortedCloneList, this.CloneCommunityViewStatisticsTextList(sortedCloneList), (d) => d.classType + ":" + d.classId, (d) => d.filePath, () => 10);
                    break;
                case "clone fragment":
                    // sortedCloneList = this.cloneListToShow.sort((a, b) => b.sumChangeCount - a.sumChangeCount);
                    this.fragmentViewBuilder.edgeListUpdated(this.cloneListToShow, this.CloneCommunityViewStatisticsTextList(this.cloneListToShow), FRAGMENT_LABEL_GETTER, secondaryPropertyGetter, () => 10, specialEdgeListGetter);
                    break;
            }
            this.fragmentViewBuilder.nodeShapeUpdated(d => {
                switch (d.classType) {
                    case "1":
                        return 2;
                    case "2":
                        return 3;
                    case "3":
                        return 4;
                }
            }, () => 10, this.fragmentViewNodeHoveredHandler, () => { }, [
                { index: 0, text: "source of this clone", clickHandler: (d) => Utilities.openCloneInstanceDetailInNewTabs(this.fragmentViewNodeSelectedCloneListGetter("single", d)) },
                { index: 1, text: "sources of this class", clickHandler: (d) => Utilities.openCloneInstanceDetailInNewTabs(this.fragmentViewNodeSelectedCloneListGetter("class", d)) },
                { index: 2, text: "sources of this directory", clickHandler: (d) => Utilities.openCloneInstanceDetailInNewTabs(this.fragmentViewNodeSelectedCloneListGetter("directory", d)) },
                { index: 4, text: "add other clones", clickHandler: (d) => this.addAllClonesFromSameClassIntoSelectedClonesRequestedHandler(d.classType, d.classId) },
                {
                    index: 5, text: "evolution of SPCP clones", clickHandler: (d) => {
                        var type = d.classType;
                        var chainId = d.chainId;
                        var associatingCloneId = d.id;
                        var list = [{ type: type, id: chainId.toString(), associatingCloneId: associatingCloneId }];
                        var others = this.cloneDataSet.supportCountMap.types[type].supportCounts[chainId];
                        if (others) {
                            list.push(...Object.keys(others).map(d => {
                                return {
                                    type: type,
                                    id: d,
                                    associatingCloneId: this.cloneDataSet.cloneList.find(c => c.chainId.toString() == d).id
                                };
                            }));
                        }
                        Utilities.openEvolutionVisualizationInNewTab(list);
                    }
                }
            ]);
            this.updateFragmentViewNodeColor();
        }
        loadMainSplitViewBuilder(mainSplitViewBuilder) {
            this.mainSplitViewBuilder = mainSplitViewBuilder;
            return this;
        }
        loadSummaryViewBuilder(tileViewBuilder) {
            this.summaryViewBuilder = tileViewBuilder;
            return this;
        }
        loadFragmentViewBuilder(classForceLayoutBuilder) {
            this.fragmentViewBuilder = classForceLayoutBuilder;
            return this;
        }
        loadFileViewBuilder(fileForceLayoutBuilder) {
            this.fileViewBuilder = fileForceLayoutBuilder;
            return this;
        }
        loadControlPanelBuilder(controlPanelBuilder) {
            this.controlPanelBuilder = controlPanelBuilder;
            return this;
        }
        loadHeatmapViewBuilder(heatmapBuilder) {
            this.heatmapViewBuilder = heatmapBuilder;
            return this;
        }
        initialize() {
            d3.json(Utilities.SYSTEM_INFO_DATA_FILE_PATH).then((systemInfo) => {
                d3.json(Utilities.CLASS_LIST_DATA_FILE_PATH).then((classList) => {
                    d3.json(Utilities.FILE_LIST_DATA_FILE_PATH).then((fileList) => {
                        d3.json(Utilities.CLONE_LIST_DATA_FILE_PATH).then((cloneList) => {
                            d3.json(Utilities.SUPPORT_COUNT_MAP_DATA_FILE_PATH).then((supportCountMap) => {
                                this.cloneDataSet.systemInfo = systemInfo;
                                this.cloneDataSet.classList = classList;
                                this.cloneDataSet.fileList = fileList;
                                this.cloneDataSet.cloneList = cloneList;
                                this.cloneDataSet.supportCountMap = supportCountMap;
                                MainModel.SystemName = systemInfo.name;
                                this.controlPanelBuilder.initialize(this);
                                this.summaryViewBuilder.cloneDataSetUpdated(this.cloneDataSet, this.selectedCloneListUpdatedHandler);
                                console.log("total change count in last revision: " + this.cloneDataSet.cloneList.map(d => d.sumChangeCount).reduce((prev, curr) => +prev + +curr, 0));
                                console.log("total support count in last revision: " + this.calculateSumSupportCount(this.cloneDataSet.cloneList));
                            });
                        });
                    });
                });
            });
        }
        calculateSumSupportCount(clones) {
            var totalCount = 0;
            this.iterateSupportCountsForCloneList(clones, (a, b, count) => totalCount += count);
            return totalCount;
        }
        iterateSupportCountsForCloneList(clones, callback) {
            for (var i = 0; i < clones.length; i++) {
                for (var j = i + 1; j < clones.length; j++) {
                    var cloneA = clones[i];
                    var cloneB = clones[j];
                    var cloneATypeSupportCountMap = this.cloneDataSet.supportCountMap.types[cloneA.classType];
                    if (cloneATypeSupportCountMap) {
                        var cloneASupportCountMap = cloneATypeSupportCountMap.supportCounts[cloneA.chainId];
                        if (cloneASupportCountMap) {
                            var supportCount = cloneASupportCountMap[cloneB.chainId];
                            callback(cloneA, cloneB, supportCount ? supportCount : 0);
                        }
                    }
                }
            }
        }
    }
    Models.MainModel = MainModel;
})(Models || (Models = {}));
/// <reference path="./ComponentBuilders/SvgBuilder.ts" />
/// <reference path="./ComponentBuilders/MainSplitViewBuilder.ts" />
/// <reference path="./ComponentBuilders/ControlPanelBuilder.ts" />
/// <reference path="./ComponentBuilders/FourPartsSplitViewBuilder.ts" />
/// <reference path="./ComponentBuilders/TileViewBuilder.ts" />
/// <reference path="./ComponentBuilders/ForceLayoutBuilder.ts" />
/// <reference path="./ComponentBuilders/HeatmapBuilder.ts" />
/// <reference path="./Models/MainModel.ts" />
const BODY = d3.select("body");
var mainSplit = new ComponentBuilders.MainSplitViewBuilder()
    .setContainer(BODY)
    .build();
var controlPanel = new ComponentBuilders.ControlPanelBuilder()
    .setContainer(mainSplit.control_view_selection)
    .build();
var visSplit = new ComponentBuilders.FourPartsSplitViewBuilder()
    .setContainer(mainSplit.vis_view_selection)
    .build();
var summaryView = new ComponentBuilders.TileViewBuilder()
    .setContainer(visSplit.upper_right_selection)
    .build();
var fragmentView = new ComponentBuilders.ForceLayoutBuilder()
    .setContainer(visSplit.upper_left_selection)
    .build();
var fileView = new ComponentBuilders.ForceLayoutBuilder()
    .setContainer(visSplit.lower_right_selection)
    .build();
var heatmapView = new ComponentBuilders.HeatmapBuilder()
    .setContainer(visSplit.lower_left_selection)
    .build();
var model = new Models.MainModel()
    .loadMainSplitViewBuilder(mainSplit)
    .loadControlPanelBuilder(controlPanel)
    .loadSummaryViewBuilder(summaryView)
    .loadFragmentViewBuilder(fragmentView)
    .loadFileViewBuilder(fileView)
    .loadHeatmapViewBuilder(heatmapView)
    .initialize();
//# sourceMappingURL=script.js.map