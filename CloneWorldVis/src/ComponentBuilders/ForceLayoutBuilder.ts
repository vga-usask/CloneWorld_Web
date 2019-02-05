/// <reference path="./SvgBuilder.ts" />
/// <reference path="../Models/CloneDataSet.ts" />

namespace ComponentBuilders {
    export class ForceLayoutBuilder extends SvgBuilder {
        secondarySelection: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        currentCloneList: Models.CloneInstance[];
        edgeOpacityScale: d3.ScalePower<number, number>;

        sampleSourceCodeShowed = false;

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

        nodeHighlightUpdated(highlightPredicate: (clone: Models.CloneInstance) => boolean) {
            var nodeSelection = this.mainSelection.selectAll(".zoomable-g g.node").selectAll("circle, path");
            nodeSelection.attr("stroke-width", (d: any) => highlightPredicate(d.reference) ? "3px" : "1px");
            var data = nodeSelection.data();
            nodeSelection.attr("opacity", (d: any) => {
                if (data.find((da: any) => highlightPredicate(da.reference))) {
                    return highlightPredicate(d.reference) ? 1 : .5;
                }
                else {
                    return 1;
                }
            });
            var edgeSelection = this.mainSelection.selectAll(".zoomable-g g.edge").selectAll("line");
            edgeSelection.attr("opacity", (d: any) => {
                var highlightedList = data.filter((da: any) => highlightPredicate(da.reference));
                if (highlightedList.length > 0) {
                    return this.edgeOpacityScale(d.weight) *
                        (highlightedList.find((da: any) => da == d.source) &&
                            highlightedList.find((da: any) => da == d.target) ?
                            1 : .5);
                }
                else {
                    return this.edgeOpacityScale(d.weight);
                }
            })
        }

        nodeShapeUpdated(
            shapeGetter: (clone: Models.CloneInstance) => number,
            sizeGetter: (clone: Models.CloneInstance) => number,
            nodeHoverHandler: (clone: Models.CloneInstance) => void,
            nodeDragHandler: (clone: Models.CloneInstance) => void,
            contextMenuItemList: { index: number, text: string, clickHandler: (d: any) => void }[]
        ) {
            if (this.sampleSourceCodeShowed == false && contextMenuItemList && contextMenuItemList.length == 3 && this.currentCloneList && this.currentCloneList.length >= 3) {
                contextMenuItemList[0].clickHandler(this.currentCloneList[0]);
                contextMenuItemList[1].clickHandler(this.currentCloneList[1]);
                contextMenuItemList[2].clickHandler(this.currentCloneList[2]);

                this.sampleSourceCodeShowed;
            }

            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);

            var svgSelection = this.mainSelection;
            var nodeSelection = this.mainSelection.selectAll(".zoomable-g g.node");
            nodeSelection.selectAll("*").remove();
            nodeSelection.append("path")
                .attr("d", d3.symbol().type((d: any) => d3.symbols[shapeGetter(d.reference)]).size((d: any) => Math.pow(sizeGetter(d.reference), 2)))
                .attr("fill", (d: any) => colors(d.module).toString())
                .attr("stroke", "black")
                // .attr("stroke-width", () => d.border ? "3px" : "1px")
                .attr("draggable", true)
                .on("dragstart", (d: any) => nodeDragHandler(d.reference))
                .on("contextmenu", (d: any) => {
                    d3.event.preventDefault();
                    var mousePosition = d3.mouse(svgSelection.node() as any);
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
                .on("mouseover", (d: any) => nodeHoverHandler(d.reference))
                .on("mouseout", () => nodeHoverHandler(null))
                .append("title").text((d: any) => d.id);
        }

        private generateContextMenuItem(index: number, text: string, clickHandler?: (d: any) => void, datum?: any) {
            this.mainSelection.select("g.context-menu")
                .append("text")
                .datum(datum)
                .attr("x", 5)
                .attr("y", 20 + index * 25)
                .style("cursor", "pointer")
                .text(text)
                .on("click", clickHandler);
        }

        nodeColorUpdated(colorGetter: (clone: Models.CloneInstance) => string) {
            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);

            this.mainSelection.selectAll(".zoomable-g g.node").selectAll("path, circle")
                .attr("fill", (d: any) => colorGetter(d.reference) ? colorGetter(d.reference) : colors(d.module).toString());
        }

        edgeListUpdated(
            cloneList: Models.CloneInstance[],
            statisticsTextList: string[],
            primaryItemGetter: (clone: Models.CloneInstance) => any,
            secondaryItemGetter: (clone: Models.CloneInstance) => any,
            nodeSizeGetter: (clone: Models.CloneInstance) => number,
            specialEdgeListGetter?: () => { id?: any; source: any; target: any; weight: number; border?: boolean; }[]
        ) {
            this.currentCloneList = cloneList;

            this.mainSelection.select(".zoomable-g").selectAll("*").remove();

            var primaryItemMap = this.generatePrimaryItemMap(cloneList, primaryItemGetter, secondaryItemGetter);
            var edgeList: { id?: any; source: any; target: any; weight: number; border?: boolean; }[];
            if (specialEdgeListGetter) {
                edgeList = specialEdgeListGetter();
            }
            else {
                edgeList = this.generateEdgeList(primaryItemMap);
            }
            var nodeList = Array.from(primaryItemMap.entries()).map(
                d => { return { name: d[0], count: d[1].count, reference: d[1].reference }; }
            );

            var nodeHash = {};
            var nodes: { id: any, label: any, reference: any, count: number, module?: any, border?: boolean }[] = [];
            var edges: { id: string, source: any, target: any, weight: number, border?: boolean }[] = [];
            for (const node of nodeList) {
                var n: { id: any, label: any, count: number, reference: any, module?: any, border?: boolean };
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

        private createForceNetwork(
            edges: { id?: any, source: any; target: any; weight: number; border?: boolean }[],
            nodes: { id: any; label: any; count: number; reference: any; module?: any, border?: boolean }[],
            nodeSizeGetter: (clone: Models.CloneInstance) => number
        ) {
            this.edgeOpacityScale = d3.scalePow()
                .domain([Math.max(...edges.map(d => d.weight)), Math.min(...edges.map(d => d.weight))])
                .range([1, 0.1]);
            var colors = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(toString)).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);

            var node_data = nodes.map(function (d) { return d.id });
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

            if (this.secondarySelection) this.secondarySelection.remove();
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
                .data(modularityGraph.nodes.filter(function (d) { return d.members.length > 1 }).filter(d => d.id != "singletons"))
                .enter()
                .append("circle")
                .attr("class", "modularity")
                .attr("r", function (d) { return d.members.length })
                .attr("stroke", "black")
                .attr("stroke-width", "1px")
                .attr("fill", function (d) { return d.id == "singletons" ? "lightgray" : colors(d.id).toString() })
                .attr("opacity", .5)
            // .on("mouseover", moduleOver(this.mainSelection))
            // .on("mouseout", moduleOut(this.mainSelection));

            var force = d3.forceSimulation()
                .force("link", d3.forceLink().id((d: any) => d.id))
                .force("collide", d3.forceCollide((d: any) => nodeSizeGetter(d.reference)))
                .force("center", d3.forceCenter(this.svgViewBoxWidth / 2, this.svgViewBoxHeight / 2))
                .force("charge", d3.forceManyBody())
                .force("y", d3.forceY(0))
                .force("x", d3.forceX(0))
                .nodes(nodes)
                // .on("tick", this.updateNetwork);
                .on("tick", () => {
                    this.mainSelection.select(".zoomable-g").selectAll("line")
                        .attr("x1", function (d: any) { return d.source.x })
                        .attr("y1", function (d: any) { return d.source.y })
                        .attr("x2", function (d: any) { return d.target.x })
                        .attr("y2", function (d: any) { return d.target.y });

                    this.mainSelection.select(".zoomable-g").selectAll("g.node")
                        .attr("transform", function (d: any) { return "translate(" + d.x + "," + d.y + ")" });

                    this.secondarySelection.selectAll("circle")
                        .each(function (d: any) {
                            var theseNodes = d.members;
                            var avgX = d3.mean(theseNodes, function (p: any) { return p.x });
                            var avgY = d3.mean(theseNodes, function (p: any) { return p.y });
                            d.x = avgX / 5;
                            d.y = avgY / 5;
                        })
                        .attr("transform", function (d: any) { return "translate(" + d.x + "," + d.y + ")" });

                    this.secondarySelection.selectAll("line")
                        .attr("x1", function (d: any) { return d.source.x })
                        .attr("y1", function (d: any) { return d.source.y })
                        .attr("x2", function (d: any) { return d.target.x })
                        .attr("y2", function (d: any) { return d.target.y });
                });

            force.force<d3.ForceLink<any, any>>("link")
                .links(edges);
            // var force = d3.forceSimulation().nodes(nodes).links(edges)
            //     .size([500, 500])
            //     .charge(-300)
            //     .gravity(0.2)
            //     .on("tick", updateNetwork);

            var edgeEnter = this.mainSelection.select(".zoomable-g").selectAll("g.edge")
                .data(edges, function (d: any) { return d.id })
                .enter()
                .append("g")
                .attr("class", "edge");

            edgeEnter
                .append("line")
                .attr("stroke-width", function (d) { return d.border ? "3px" : "1px" })
                .attr("opacity", d => this.edgeOpacityScale(d.weight))
                .attr("stroke", "black")
                .attr("pointer-events", "none");

            var nodeEnter = this.mainSelection.select(".zoomable-g").selectAll("g.node")
                .data(nodes, function (d: any) { return d.id })
                .enter()
                .append("g")
                .attr("class", "node")
            // .call(force.drag());

            nodeEnter.append("circle")
                .attr("r", 8)
                .attr("fill", function (d) { return colors(d.module).toString() })
                .attr("stroke", "black")
                .attr("stroke-width", function (d) { return d.border ? "3px" : "1px" })
                .attr("draggable", true)
                .on("dragstart", d => {
                    d3.event.dataTransfer.setData("filepath", d.id.replace("/Users/avigitsaha/Google_Drive/by_language/Java/5-Terasology-develop", "data_files"));
                });



            nodeEnter.append("title").text(d => d.id);

            function moduleOver(mainSelection) {
                return function (d) {
                    console.log("MODULE", d);
                    d3.select(this)
                        .style("stroke-width", "4px")
                    mainSelection.selectAll("path, circle")
                        .style("stroke-width", function (p: any) { return p.module == d.id ? "4px" : "1px" })
                }
            }

            function moduleOut(mainSelection) {
                return function (d) {
                    d3.select(this)
                        .style("stroke-width", "1px")
                    mainSelection.selectAll("path, circle")
                        .style("stroke-width", "1px")
                }
            }
        }

        private nodeSelectedOpenNewTabsHandler(
            mode: string,
            nodeSelectedCloneListGetter: (mode: string, clone: Models.CloneInstance) => Models.CloneInstance[]
        ) {
            return (d: any) => {
                var clones: Models.CloneInstance[] = nodeSelectedCloneListGetter(mode, d.reference);

                Utilities.openCloneInstanceDetailInNewTabs(clones);
            };
        }

        private modularityCensus(edges: { id?: any; source: any; target: any; weight: number; border?: boolean; }[], nodes: { id: any; label: any; count: number; reference: any; module?: any; border?: boolean; }[]) {
            for (const edge of edges) {
                if (edge.source.module !== edge.target.module) {
                    edge["border"] = false;//sean: was true before
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

        private onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        private generateEdgeList(primaryItemMap: Map<any, { count: number; secondaryItemSet: Set<any>; }>) {
            var edgeList: {
                id?: any;
                source: any;
                target: any;
                weight: number;
                border?: boolean
            }[] = [];
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

        private generatePrimaryItemMap(cloneList: Models.CloneInstance[], primaryItemGetter: (clone: Models.CloneInstance) => any, secondaryItemGetter: (clone: Models.CloneInstance) => any) {
            var primaryItemMap: Map<any, { count: number, reference: any, secondaryItemSet: Set<any> }> = new Map();

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
}