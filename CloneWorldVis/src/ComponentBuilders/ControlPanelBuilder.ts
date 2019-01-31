/// <reference path="./ComponentBuilderBase.ts" />

namespace ComponentBuilders {
    export class ControlPanelBuilder extends ComponentBuilderBase {
        private fragmentViewNodeColorControl: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        private fragmentViewEdgeTypeControl: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

        constructor() {
            super();
            this.setTagName("div");
        }

        protected buildExtra(): void {
            this.mainSelection.style("overflow-y", "auto")
                .style("margin", "5px")
                .style("font-size", "0.7em");
        }

        updateFragmentViewNodeColorControl(enabled: boolean, defaultValue: string) {
            if (this.fragmentViewNodeColorControl) {
                this.updateDropDownControl(
                    this.fragmentViewNodeColorControl,
                    enabled,
                    undefined,
                    undefined,
                    undefined,
                    defaultValue
                );
            }
        }

        updateFragmentViewEdgeTypeControl(enabled: boolean, defaultValue: string) {
            if (this.fragmentViewNodeColorControl) {
                this.updateDropDownControl(
                    this.fragmentViewEdgeTypeControl,
                    enabled,
                    undefined,
                    undefined,
                    undefined,
                    defaultValue
                );
            }
        }

        initialize(mainModel: Models.MainModel) {
            this.generateGlobalControls(mainModel);
            this.mainSelection.append("hr");
            this.generateFragmentViewControls(mainModel);
            this.mainSelection.append("hr");
            this.generateFileViewControls(mainModel);
        }

        private generateGlobalControls(mainModel: Models.MainModel) {
            var globalControl = this.generateControlGroup("CONTROL PANEL");

            this.generateCheckBoxControl(
                globalControl,
                true,
                "Clone Landscape",
                mainModel.isSummaryViewShowingContourUpdatedHandler,
                true
            );

            this.generateCheckBoxControl(
                globalControl,
                true,
                "Last Revision Only",
                mainModel.isShowingOnlyTheLastRevisionUpdatedHandler,
                true
            );

            this.generateSliderControl(
                globalControl,
                true,
                "Support Count >= ",
                mainModel.selectionFilterLowerLimitBySupportCountUpdatedHandler,
                0,
                mainModel.maxSumChangeCount,
                1
            );
            this.generateSliderControl(
                globalControl,
                true,
                "At Most",
                mainModel.maxSelectionLimitationByChangeCountUpdatedHandler,
                0,
                2000,
                150,
                "Clones"
            );
            this.generateTextBoxControl(
                globalControl,
                true,
                "Search {type}:{class id}:{clone id}|{file path}",
                mainModel.controlPanelSearchCloneHandler
            );
        }

        private generateFragmentViewControls(mainModel: Models.MainModel) {
            var fragmentViewControl = this.generateControlGroup("CLONE COMMUNITY VIEW");

            this.generateDropDownControl(
                fragmentViewControl,
                true,
                "Nodes Represent",
                ["class", "clone fragment"],
                mainModel.fragmentViewNodeTypeUpdatedHandler,
                "clone fragment"
            );
            this.fragmentViewEdgeTypeControl = this.generateDropDownControl(
                fragmentViewControl,
                true,
                "Edges Represent",
                ["class", "file", "support count"],
                mainModel.fragmentViewEdgeTypeUpdatedHandler,
                "class"
            );
            this.fragmentViewNodeColorControl = this.generateDropDownControl(
                fragmentViewControl,
                true,
                "Nodes colored by",
                ["automatic", "directory", "class"],
                mainModel.fragmentViewNodeColorUpdatedHandler,
                "directory"
            );
        }

        private generateFileViewControls(mainModel: Models.MainModel) {
            var fileViewControl = this.generateControlGroup("FILE COMMUNITY VIEW");

            this.generateDropDownControl(
                fileViewControl,
                true,
                "Nodes colored by",
                ["automatic", "directory"],
                mainModel.fileViewNodeColorUpdatedHandler,
                "directory"
            );

            this.generateDropDownControl(
                fileViewControl,
                true,
                "Edges Represent",
                ["class", "support count"],
                mainModel.controlPanelFileViewEdgeTypeUpdatedHandler,
                "class"
            );
        }

        private generateControlGroup(label: string) {
            var div = this.mainSelection;
            div.append("div")
                .append("h3")
                .text(label)
                .style("margin", 0);

            return div;
        }

        private generateTextBoxControl(
            container: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label: string,
            changedHandler: (value: string) => string,
            defaultValue?: number
        ) {
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

        private updateTextBoxControl(
            control: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label?: string,
            changedHandler?: (value: string) => string,
            defaultValue?: number
        ) {
            this.updateControlItem(control, enabled, label);
            if (changedHandler) {
                control.on("change", () => {
                    var ele = control.select("input.control-interact").node() as any;
                    control.select("label.control-text-box-result-text")
                        .text(changedHandler(ele.value));
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node() as any;
                ele.value = defaultValue;
                (control.on("change") as any)(ele.value);
            }
        }

        private generateSliderControl(
            container: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label: string,
            changedHandler: (value: number) => void,
            minValue?: number,
            maxValue?: number,
            defaultValue?: number,
            textAfterValue?: string
        ) {
            var control = this.generateControlItem(container);
            control.append("label").classed("control-slider-value-text", true);
            control.append("label").classed("control-slider-text-after-value", true);
            control.append("br");
            control.append("input")
                .attr("type", "range")
                .classed("control-interact", true)
                .on("input", () => {
                    var ele = control.select("input").node() as any;
                    control.select("label.control-slider-value-text").text(" " + ele.value + " ");
                });
            this.updateSliderControl(control, enabled, label, changedHandler, minValue, maxValue, defaultValue, textAfterValue);

            return control;
        }

        private updateSliderControl(
            control: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label?: string,
            changedHandler?: (value: number) => void,
            minValue?: number,
            maxValue?: number,
            defaultValue?: number,
            textAfterValue?: string
        ) {
            this.updateControlItem(control, enabled, label);
            if (minValue != undefined) {
                control.select("input.control-interact").attr("min", minValue);
            }
            if (maxValue != undefined) {
                control.select("input.control-interact").attr("max", maxValue);
            }
            if (changedHandler) {
                control.on("change", () => {
                    var ele = control.select("input.control-interact").node() as any;
                    changedHandler(ele.value);
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node() as any;
                ele.value = defaultValue;
                control.select("label.control-slider-value-text").text(" " + ele.value + " ");
                (control.on("change") as any)(ele.value);
            }
            if (textAfterValue != undefined) {
                control.select("label.control-slider-text-after-value").text(textAfterValue);
            }
        }

        private generateCheckBoxControl(
            container: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label: string,
            changedHandler: (value: boolean) => void,
            defaultValue?: boolean
        ) {
            var control = this.generateControlItem(container);
            control.append("label").text(" ");
            control.append("input").attr("type", "checkbox").classed("control-interact", true);
            this.updateCheckBoxControl(control, enabled, label, changedHandler, defaultValue);

            return control;
        }

        private updateCheckBoxControl(
            control: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label?: string,
            changedHandler?: (value: boolean) => void,
            defaultValue?: boolean
        ) {
            this.updateControlItem(control, enabled, label);

            if (changedHandler) {
                control.on("change", () => {
                    var checked = (control.select("input.control-interact").node() as any).checked;
                    changedHandler(checked);
                });
            }
            if (defaultValue != undefined) {
                var ele = control.select("input.control-interact").node() as any;
                ele.checked = defaultValue;
                (control.on("change") as any)(ele.checked);
            }
        }

        private generateDropDownControl(
            container: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label: string,
            options: string[],
            changedHandler: (value: string) => void,
            defaultValue?: string
        ) {
            var control = this.generateControlItem(container);
            control.append("br");
            control.append("select").classed("control-interact", true);
            this.updateDropDownControl(control, enabled, label, options, changedHandler, defaultValue);

            return control;
        }

        private updateDropDownControl(
            control: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label?: string,
            options?: string[],
            changedHandler?: (value: string) => void,
            defaultValue?: string
        ) {
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
                    let ele = control.select("select.control-interact").node() as any;
                    changedHandler(ele.options[ele.selectedIndex].value);
                });
            }
            if (defaultValue) {
                let ele = control.select("select.control-interact").node() as any;
                ele.value = defaultValue;
                (control.on("change") as any)(ele.options[ele.selectedIndex].value);
            }
        }

        private generateControlItem(container: d3.Selection<d3.BaseType, {}, HTMLElement, any>) {
            var control = container.append("div");
            control.append("label").classed("control-label", true);

            return control;
        }

        private updateControlItem(
            control: d3.Selection<d3.BaseType, {}, HTMLElement, any>,
            enabled: boolean,
            label?: string
        ) {
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
}