namespace ComponentBuilders {
    export abstract class ComponentBuilderBase {
        private tagName: string;
        private className: string;
        private idName: string;

        /** d3 selection of the builder's container element */
        container: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
        /** d3 selection of the builder's main element */
        mainSelection: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

        private get containerBoundingClientRect() { return (this.container.node() as HTMLElement).getBoundingClientRect(); }
        private get mainSelectionBoundingClientRect() { return (this.container.node() as HTMLElement).getBoundingClientRect(); }

        get containerWidth() { return this.containerBoundingClientRect.width; }
        get containerHeight() { return this.containerBoundingClientRect.height; }
        get mainSelectionWidth() { return this.mainSelectionBoundingClientRect.width; }
        get mainSelectionHeight() { return this.mainSelectionBoundingClientRect.height; }

        setContainer(container: d3.Selection<d3.BaseType, {}, HTMLElement, any>) {
            this.container = container;
            return this;
        }

        setTagName(tagName: string) {
            this.tagName = tagName;
            return this;
        }

        setClassName(className: string) {
            this.className = className;
            return this;
        }

        setIdName(idName: string) {
            this.idName = idName;
            return this;
        }

        build() {
            this.mainSelection = this.container.append(this.tagName);
            if (this.className) this.mainSelection.classed(this.className, true);
            if (this.idName) this.mainSelection.attr("id", this.idName);

            this.buildExtra();

            return this;
        }

        /** Override this method to add more procedures of initializing the builder */
        protected abstract buildExtra(): void;
    }
}