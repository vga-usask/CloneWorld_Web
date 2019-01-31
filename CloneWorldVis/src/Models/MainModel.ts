/// <reference path="./CloneDataSet.ts" />


namespace Models {
    export class MainModel {
        static SystemName: string;

        private maxSelectionLimitationByChangeCount: number;
        private selectionFilterLowerLimitBySupportCount: number;
        private fragmentViewNodeType: string;
        private fragmentViewEdgeType: string;
        private fragmentViewNodeColorBy: string;
        private fileViewNodeColorBy: string;
        private fileViewEdgeType: string;
        private isShowingOnlyLastRevision: boolean;
        private selectedCloneList: CloneInstance[] = [];

        private get cloneListToShow() {
            var temp = this.isShowingOnlyLastRevision ?
                this.selectedCloneList.filter(d => d.finalRevision == this.cloneDataSet.systemInfo.finalRevision) : this.selectedCloneList;

            temp = temp.filter(d => {
                var map = this.cloneDataSet.supportCountMap.types[d.classType].supportCounts[d.chainId];
                var max = 0;
                if (map) {
                    max = Math.max(...(Object.keys(map) as any).map((key) => map[key]));
                }
                return max >= this.selectionFilterLowerLimitBySupportCount;
            })
            temp = temp.sort((a, b) => b.sumChangeCount - a.sumChangeCount)
                .slice(0, this.maxSelectionLimitationByChangeCount);

            return temp;
        }

        cloneDataSet: CloneDataSet = new CloneDataSet();

        mainSplitViewBuilder: ComponentBuilders.MainSplitViewBuilder;
        heatmapViewBuilder: ComponentBuilders.HeatmapBuilder;
        summaryViewBuilder: ComponentBuilders.TileViewBuilder;
        fragmentViewBuilder: ComponentBuilders.ForceLayoutBuilder;
        fileViewBuilder: ComponentBuilders.ForceLayoutBuilder;
        controlPanelBuilder: ComponentBuilders.ControlPanelBuilder;

        get maxSumChangeCount() {
            return Math.max(...this.cloneDataSet.cloneList.map(d => d.sumChangeCount));
        }

        private get cloneCountInFileScale() {
            var reducedCloneList = this.cloneListToShow.filter((d, i) => i == this.cloneListToShow.findIndex(c => c.filePath == d.filePath));
            var domainList = reducedCloneList.map(d => this.cloneListToShow.filter(c => c.filePath == d.filePath).length);
            return d3.scaleLinear()
                .domain([Math.min(...domainList), Math.max(...domainList)])
                .range([10, 30]);
        }

        CloneCommunityViewStatisticsTextList(cloneList: CloneInstance[]) {
            var nodeType: string;
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

        FileCommunityViewStatisticsTextList(cloneList: CloneInstance[]) {
            return [
                "File COM.",
                "Node: file",
                "Edge: class",
                "Node Count: " + cloneList.length
            ];
        }

        forceLayoutNodeDragHandler = (clone: CloneInstance) => {
            if (this.fragmentViewNodeType != "class") {
                var lineNumbers = this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(clone);
                d3.event.dataTransfer.setData("fileInfo", JSON.stringify({
                    path: clone.filePath,
                    highlight: lineNumbers
                }));
            }
        }

        controlPanelFileViewEdgeTypeUpdatedHandler = (edgeType: string) => {
            this.fileViewEdgeType = edgeType;
            this.updateFileView();
        }

        controlPanelSearchCloneHandler = (query: string) => {
            try {
                let querySplit_1 = query.split(",");
                this.selectedCloneList = [];
                for (const q of querySplit_1) {
                    let querySplit_2 = q.split("|");
                    if (querySplit_2[0]) {
                        let querySplit_3 = querySplit_2[0].split(":");
                        let selectionList: CloneInstance[] = [];
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
        }

        heatmapViewReduceCloneSelectionHandler = (chainList: any) => {
            var newList = [];
            for (const chain of chainList) {
                var type = (chain as string).split(":")[0] as any;
                var id = (chain as string).split("@")[1] as any;
                var index = this.selectedCloneList.findIndex(d => type == d.classType && id == d.chainId);
                if (index >= 0) {
                    newList.push(...this.selectedCloneList.splice(index, 1));
                }
            }
            this.selectedCloneList = newList;
            this.updateSelectedCloneList();
        }

        fragmentViewNodeSelectedCloneListGetter = (mode: string, clone: CloneInstance) => {
            switch (mode) {
                case "single":
                    return [clone];
                case "directory":
                    return this.cloneListToShow.filter(d => d.DC == clone.DC);
                case "class":
                    return this.cloneListToShow.filter(d => d.classType == clone.classType && d.classId == clone.classId);
            }
        }

        fileViewNodeHoveredHandler = (clone: CloneInstance) => {
            this.updateFragmentViewNodeHighlight(clone);
            this.updateHeatmapViewCellHighlight(clone, c => c ? this.cloneListToShow.filter(d => d.filePath == c.filePath) : []);
        }

        isSummaryViewShowingContourUpdatedHandler = (isShowing: boolean) => {
            this.summaryViewBuilder.imagePathUpdated("tiles/" + (isShowing ? "contour" : "plain"));
        }

        private getLineNumberListForFileWithinSelctedRangeFromSingleClone(clone: CloneInstance) {
            var clonesInSameFile = this.cloneListToShow.filter(d => d.filePath == clone.filePath);
            var lineNumbers = this.getLineNumberListForFileFromClones(clonesInSameFile);
            return lineNumbers;
        }

        private getLineNumberListForFileFromClones(clonesInSameFile: CloneInstance[]) {
            var lineNumbers = new Set<number>();
            for (const clone of clonesInSameFile) {
                for (var i = clone.startLine; i <= clone.endLine; i++) {
                    lineNumbers.add(i);
                }
            }
            return Array.from(lineNumbers);
        }

        private updateFragmentViewNodeHighlight(clone: CloneInstance) {
            this.fragmentViewBuilder.nodeHighlightUpdated(d => (clone ? d.filePath == clone.filePath : false));
        }

        fragmentViewNodeHoveredHandler = (clone: CloneInstance) => {
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
        }

        private updateHeatmapViewCellHighlight(clone: CloneInstance, cloneListGetter: (c: CloneInstance) => CloneInstance[]) {
            heatmapView.updateHighlight(cloneListGetter(clone));
        }

        private updateFileViewNodeHighlight(clone: CloneInstance) {
            this.fileViewBuilder.nodeHighlightUpdated(d => (clone ? d.filePath == clone.filePath : false));
        }

        addAllClonesFromSameClassIntoSelectedClonesRequestedHandler = (classType: string, classId: number) => {
            for (const clone of this.cloneDataSet.cloneList) {
                if (clone.classType == classType && clone.classId == classId && !this.selectedCloneList.find(d => d == clone)) {
                    this.selectedCloneList.push(clone);
                }
            }
            this.updateFragmentView();
            this.updateFileView();
        }

        maxSelectionLimitationByChangeCountUpdatedHandler = (limit: number) => {
            this.maxSelectionLimitationByChangeCount = limit;
            this.updateSelectedCloneList();
        }

        selectionFilterLowerLimitBySupportCountUpdatedHandler = (max: number) => {
            this.selectionFilterLowerLimitBySupportCount = max;
            this.updateSelectedCloneList();
        }

        isShowingOnlyTheLastRevisionUpdatedHandler = (isShowing: boolean) => {
            this.isShowingOnlyLastRevision = isShowing;

            this.updateFragmentView();
            this.updateFileView();
        }

        fragmentViewNodeColorUpdatedHandler = (byWhat: string) => {
            if (byWhat) {
                this.fragmentViewNodeColorBy = byWhat;
            }
            this.updateFragmentViewNodeColor();
        }

        private updateFragmentViewNodeColor() {
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

        fileViewNodeColorUpdatedHandler = (byWhat: string) => {
            if (byWhat) {
                this.fileViewNodeColorBy = byWhat;
            }
            this.updateFileViewNodeColor();
        }

        private updateFileViewNodeColor() {
            switch (this.fileViewNodeColorBy) {
                case "automatic":
                    this.fileViewBuilder.nodeColorUpdated(d => null);
                    break;
                case "directory":
                    this.fileViewBuilder.nodeColorUpdated(d => d.DC);
                    break;
            }
        }

        fragmentViewNodeTypeUpdatedHandler = (nodeType: string) => {
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
        }

        fragmentViewEdgeTypeUpdatedHandler = (edgeType: string) => {
            this.fragmentViewEdgeType = edgeType;
            this.updateFragmentView();
        }

        selectedCloneListUpdatedHandler = (selectedCloneList: CloneInstance[]) => {
            if (selectedCloneList) {
                this.selectedCloneList = selectedCloneList;
            }
            this.updateSelectedCloneList();
        };

        private updateSelectedCloneList() {
            this.updateFragmentView();
            this.updateFileView();
            this.updateHeatmap();
        }

        private updateHeatmap() {
            var data: { idX: any, idY: any, x: number, y: number, value: number, referenceX: CloneInstance, referenceY: CloneInstance }[] = [];

            var cloneChains = this.cloneListToShow
                .map(d => { return { chainId: d.classType + ":" + d.classId + ":" + d.id + "@" + d.chainId, reference: d }; })
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
                    } catch { }
                    data.push({
                        x: i,
                        y: j,
                        idX: idX,
                        idY: idY,
                        value: val ? val : 0,
                        referenceX: referenceX,
                        referenceY: referenceY
                    })
                }
            }

            this.heatmapViewBuilder.dataUpdated(data, cloneChains.length, this.heatmapViewCellSelectedCloneListGetter, this.heatmapViewReduceCloneSelectionHandler);
        }

        heatmapViewCellSelectedCloneListGetter = (ids: any[]) => {
            return this.cloneListToShow.filter(d => ids.find(da => da == d.classType + ":" + d.chainId));
        }

        private updateFileView() {
            var reducedCloneList = this.cloneListToShow.filter((d, i) => i == this.cloneListToShow.findIndex(da => da.filePath == d.filePath));
            var primaryPropertyGetter = (d: CloneInstance) => d.filePath + " >> " + this.cloneCountInFileGetter(d);
            var secondaryPropertyGetter: (d: CloneInstance) => any;
            var specialEdgeListGetter: () => { id?: any; source: any; target: any; weight: number; border?: boolean; }[];
            switch (this.fileViewEdgeType) {
                case "class":
                    secondaryPropertyGetter = d => d.classType + ":" + d.classId;
                    break;
                case "support count":
                    secondaryPropertyGetter = d => d;
                    specialEdgeListGetter = () => {
                        var edgeList: { id?: any; source: any; target: any; weight: number; border?: boolean; }[] = [];
                        this.iterateSupportCountsForCloneList(
                            this.cloneListToShow,
                            (cloneA, cloneB, supportCount) => {
                                var edge = edgeList.find(d =>
                                    (d.source == primaryPropertyGetter(cloneA) && d.target == primaryPropertyGetter(cloneB)) ||
                                    (d.target == primaryPropertyGetter(cloneA) && d.source == primaryPropertyGetter(cloneB))
                                );
                                if (cloneA.filePath != cloneB.filePath) {
                                    if (edge) {
                                        edge.weight = Math.max(edge.weight, supportCount);
                                    }
                                    else {
                                        edgeList.push({ source: primaryPropertyGetter(cloneA), target: primaryPropertyGetter(cloneB), weight: supportCount });
                                    }
                                }
                            }
                        );
                        edgeList.filter(d => d.weight >= this.selectionFilterLowerLimitBySupportCount);
                        return edgeList;
                    }
                    break;
            }
            this.fileViewBuilder.edgeListUpdated(reducedCloneList, this.FileCommunityViewStatisticsTextList(reducedCloneList), primaryPropertyGetter, secondaryPropertyGetter, this.ScaledcloneCountInFileGetter, specialEdgeListGetter);
            this.fileViewBuilder.nodeShapeUpdated(
                () => 0,
                this.ScaledcloneCountInFileGetter,
                this.fileViewNodeHoveredHandler,
                this.forceLayoutNodeDragHandler,
                [
                    { index: 0, text: "show source in panel 1", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(1, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) },
                    { index: 1, text: "show source in panel 2", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(2, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) },
                    { index: 2, text: "show source in panel 3", clickHandler: d => this.mainSplitViewBuilder.updateSourceCodeDispaly(3, d.filePath, this.getLineNumberListForFileWithinSelctedRangeFromSingleClone(d)) }
                ]
            );
            this.fileViewNodeColorUpdatedHandler(null);
        }

        private updateFragmentView() {
            var sortedCloneList: Models.CloneInstance[] = [];
            var secondaryPropertyGetter: (d: CloneInstance) => any;
            var specialEdgeListGetter: () => { id?: any; source: any; target: any; weight: number; border?: boolean; }[];
            const FRAGMENT_LABEL_GETTER = (d: CloneInstance) => d.classType + ":" + d.classId + ":" + d.id;
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
                        var edgeList: { id?: any; source: any; target: any; weight: number; border?: boolean; }[] = [];
                        this.iterateSupportCountsForCloneList(
                            this.cloneListToShow,
                            (cloneA, cloneB, supportCount) => edgeList.push({ source: FRAGMENT_LABEL_GETTER(cloneA), target: FRAGMENT_LABEL_GETTER(cloneB), weight: supportCount })
                        );
                        return edgeList;
                    }
                    break;
            }
            switch (this.fragmentViewNodeType) {
                case "class":
                    sortedCloneList = this.cloneListToShow
                        .filter((d, i) =>
                            i == this.cloneListToShow.findIndex(c => c.classType == d.classType && c.classId == d.classId)
                        )
                    // .sort((a, b) =>
                    //     this.cloneDataSet.classList.find(d => d.type == b.classType && d.id == b.classId).cloneCount -
                    //     this.cloneDataSet.classList.find(d => d.type == a.classType && d.id == a.classId).cloneCount
                    // );
                    this.fragmentViewBuilder.edgeListUpdated(sortedCloneList, this.CloneCommunityViewStatisticsTextList(sortedCloneList), (d: CloneInstance) => d.classType + ":" + d.classId, (d: CloneInstance) => d.filePath, () => 10);
                    break;
                case "clone fragment":
                    // sortedCloneList = this.cloneListToShow.sort((a, b) => b.sumChangeCount - a.sumChangeCount);
                    this.fragmentViewBuilder.edgeListUpdated(this.cloneListToShow, this.CloneCommunityViewStatisticsTextList(this.cloneListToShow), FRAGMENT_LABEL_GETTER, secondaryPropertyGetter, () => 10, specialEdgeListGetter);
                    break;
            }
            this.fragmentViewBuilder.nodeShapeUpdated(
                d => {
                    switch (d.classType) {
                        case "1":
                            return 2;
                        case "2":
                            return 3;
                        case "3":
                            return 4;
                    }
                },
                () => 10,
                this.fragmentViewNodeHoveredHandler,
                () => { },
                [
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

        loadMainSplitViewBuilder(mainSplitViewBuilder: ComponentBuilders.MainSplitViewBuilder) {
            this.mainSplitViewBuilder = mainSplitViewBuilder;
            return this;
        }

        loadSummaryViewBuilder(tileViewBuilder: ComponentBuilders.TileViewBuilder) {
            this.summaryViewBuilder = tileViewBuilder;
            return this;
        }

        loadFragmentViewBuilder(classForceLayoutBuilder: ComponentBuilders.ForceLayoutBuilder) {
            this.fragmentViewBuilder = classForceLayoutBuilder;
            return this;
        }

        loadFileViewBuilder(fileForceLayoutBuilder: ComponentBuilders.ForceLayoutBuilder) {
            this.fileViewBuilder = fileForceLayoutBuilder;
            return this;
        }

        loadControlPanelBuilder(controlPanelBuilder: ComponentBuilders.ControlPanelBuilder) {
            this.controlPanelBuilder = controlPanelBuilder;
            return this;
        }

        loadHeatmapViewBuilder(heatmapBuilder: ComponentBuilders.HeatmapBuilder) {
            this.heatmapViewBuilder = heatmapBuilder;
            return this;
        }

        initialize() {
            d3.json(Utilities.SYSTEM_INFO_DATA_FILE_PATH).then((systemInfo: SystemInfo) => {
                d3.json(Utilities.CLASS_LIST_DATA_FILE_PATH).then((classList: any[]) => {
                    d3.json(Utilities.FILE_LIST_DATA_FILE_PATH).then((fileList: any[]) => {
                        d3.json(Utilities.CLONE_LIST_DATA_FILE_PATH).then((cloneList: any[]) => {
                            d3.json(Utilities.SUPPORT_COUNT_MAP_DATA_FILE_PATH).then((supportCountMap: SupportCountMap) => {
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
                            })
                        })
                    })
                });
            })
        }

        private readonly cloneCountInFileGetter: (clone: CloneInstance) => number = clone => {
            return this.cloneListToShow.filter(c => c.filePath == clone.filePath).length;
        }

        private readonly ScaledcloneCountInFileGetter: (clone: CloneInstance) => number = d => {
            return this.cloneCountInFileScale(this.cloneCountInFileGetter(d));
        }

        private calculateSumSupportCount(clones: CloneInstance[]) {
            var totalCount = 0;
            this.iterateSupportCountsForCloneList(clones, (a, b, count) => totalCount += count);
            return totalCount;
        }

        private iterateSupportCountsForCloneList(clones: CloneInstance[], callback: (cloneA: CloneInstance, cloneB: CloneInstance, clonecount: number) => void) {
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
}