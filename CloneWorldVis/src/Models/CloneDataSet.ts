namespace Models {
    export class CloneClass {
        type: string;
        id: number;
        cloneCount: number;
    }

    export class CloneFile {
        path: string;
        cloneCount: number;
    }

    export class CloneInstance {
        id: number;
        chainId: number;
        classType: string;
        classId: number;
        filePath: string;
        startLine: number;
        endLine: number;
        sumChangeCount: number;
        finalRevision: number;
        x: number;
        y: number;
        DC: string;
        CC: string;
    }

    export class SupportCountMap {
        types: any;
    }

    export class SystemInfo {
        name: string;
        finalRevision: number;
    }

    export class CloneDataSet {
        systemInfo: SystemInfo;
        classList: CloneClass[];
        fileList: CloneFile[];
        cloneList: CloneInstance[];
        supportCountMap: SupportCountMap;
    }
}