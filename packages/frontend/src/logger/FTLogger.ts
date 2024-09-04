import { BaseLogger } from "./BaseLogger.js";

class FTLogger extends BaseLogger {
    constructor() {
        super({ prefix: "FT-APP" });
    }
}

export const AppLogger = new FTLogger();
