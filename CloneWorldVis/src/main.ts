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