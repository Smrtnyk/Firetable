import { BaseLogger } from "./BaseLogger.js";

class DevFTLogger extends BaseLogger {
    constructor() {
        super({ prefix: "FT-DEV" });
    }

    public logPerformance(kpiName: string, value: number): void {
        this.debug(`FT Performance KPI - ${kpiName}: ${value}`);
    }
}

export const DevLogger = new DevFTLogger();
