import { beforeEach, describe, expect, it, vi } from "vitest";

import { DevLogger } from "./DevFTLogger";
import { AppLogger } from "./FTLogger";

beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(vi.fn());
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.spyOn(console, "debug").mockImplementation(vi.fn());
});

describe("DevLogger", () => {
    it("logs an info message with the correct prefix", () => {
        DevLogger.info("This is an info message");

        expect(console.info).toHaveBeenCalledWith("[FT-DEV] [INFO]: This is an info message");
    });

    it("logs a warning message with the correct prefix", () => {
        DevLogger.warn("This is a warning message");

        expect(console.warn).toHaveBeenCalledWith("[FT-DEV] [WARN]: This is a warning message");
    });

    it("logs an error message when passed an Error object", () => {
        const error = new Error("This is an error");

        DevLogger.error(error);

        expect(console.error).toHaveBeenCalledWith(
            `[FT-DEV] [ERROR]: This is an error\nStack: ${error.stack}`,
        );
    });

    it("logs an error message when passed a string", () => {
        DevLogger.error("This is a string error");

        expect(console.error).toHaveBeenCalledWith("[FT-DEV] [ERROR]: This is a string error");
    });

    it("logs performance KPIs", () => {
        DevLogger.logPerformance("PageLoadTime", 123.45);

        expect(console.debug).toHaveBeenCalledWith(
            "[FT-DEV] [DEBUG]: FT Performance KPI - PageLoadTime: 123.45",
        );
    });
});

describe("AppLogger", () => {
    it("logs an info message with the correct prefix", () => {
        AppLogger.info("This is an info message");

        expect(console.info).toHaveBeenCalledWith("[FT-APP] [INFO]: This is an info message");
    });

    it("logs a warning message with the correct prefix", () => {
        AppLogger.warn("This is a warning message");

        expect(console.warn).toHaveBeenCalledWith("[FT-APP] [WARN]: This is a warning message");
    });

    it("logs an error message when passed an Error object", () => {
        const error = new Error("This is an error");

        AppLogger.error(error);

        expect(console.error).toHaveBeenCalledWith(
            `[FT-APP] [ERROR]: This is an error\nStack: ${error.stack}`,
        );
    });

    it("logs an error message when passed a string", () => {
        AppLogger.error("This is a string error");

        expect(console.error).toHaveBeenCalledWith("[FT-APP] [ERROR]: This is a string error");
    });

    it("logs a debug message", () => {
        AppLogger.debug("This is a debug message");

        expect(console.debug).toHaveBeenCalledWith("[FT-APP] [DEBUG]: This is a debug message");
    });
});
