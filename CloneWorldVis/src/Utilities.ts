namespace Utilities {
    export const SYSTEM_INFO_DATA_FILE_PATH = "data_files/system.json";
    export const CLASS_LIST_DATA_FILE_PATH = "data_files/classes.json";
    export const FILE_LIST_DATA_FILE_PATH = "data_files/files.json";
    export const CLONE_LIST_DATA_FILE_PATH = "data_files/clones.json";
    export const SUPPORT_COUNT_MAP_DATA_FILE_PATH = "data_files/support_count_map.json";

    export const openCloneInstanceDetailInNewTabs = (clones: Models.CloneInstance[]) => {
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
    }

    export const openEvolutionVisualizationInNewTab = (chainList: { type: string, id: string, associatingCloneId: number }[]) => {
        var data: { types: [{ id: any, chains: any[], associatingCloneIds: any[] }] } = { types: [] as any };
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
        win.onload = () => (win as any).loadInfo(Models.MainModel.SystemName, data);
    }
}