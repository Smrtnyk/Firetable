import type { Formatter } from "tinyrainbow";

import c from "tinyrainbow";

interface LoggerConfig {
    colors: Record<LogLevel, Formatter>;
    // ms between progress updates
    progressUpdateInterval: number;
    symbols: Record<LogSymbol, string>;
}
type LogLevel = "error" | "info" | "success" | "warn";
type LogSymbol = "⏱" | "⚠" | "✓" | "✖" | "📦" | "ℹ";

type StatsData = Record<string, number | string>;

class Logger {
    private readonly config: LoggerConfig = {
        colors: {
            error: c.red,
            info: c.blue,
            success: c.green,
            warn: c.yellow,
        },
        // Update progress max every 100ms
        progressUpdateInterval: 100,
        symbols: {
            "⏱": "⏱",
            "⚠": "⚠",
            "✓": "✓",
            "✖": "✖",
            "📦": "📦",

            ℹ: "ℹ",
        },
    };
    private lastProgressLine = "";
    private lastUpdateTime = 0;

    error(message: string): void {
        this.log("error", "✖", message);
    }

    info(message: string): void {
        this.log("info", "ℹ", message);
    }

    organization(current: number, total: number, name: string): void {
        this.clearProgress();
        console.log(
            c.blue(`\n${this.config.symbols["📦"]} Organization`),
            c.blue(`${current}/${total}`),
            c.white(`"${name}"`),
        );
    }

    progress(current: number, total: number, message: string): void {
        if (!this.shouldUpdateProgress() && current !== total) {
            return;
        }

        const progressText = this.formatProgress(current, total);
        const progressLine = `${this.config.colors.info(this.config.symbols["ℹ"])} ${message} ${progressText}`;

        this.clearProgress();
        process.stdout.write(progressLine);
        this.lastProgressLine = progressLine;

        if (current === total) {
            this.lastProgressLine = "";
            process.stdout.write("\n");
        }
    }

    stats(stats: StatsData, indent = 0): void {
        this.clearProgress();
        const padding = " ".repeat(indent);
        Object.entries(stats).forEach(([key, value]) => {
            console.log(c.gray(`${padding}• ${key}:`), c.white(value));
        });
    }

    success(message: string): void {
        this.log("success", "✓", message);
    }

    timing(ms: number): void {
        this.clearProgress();
        const seconds = (ms / 1000).toFixed(2);
        console.log(c.gray(`${this.config.symbols["⏱"]} Completed in ${seconds}s`));
    }

    warn(message: string): void {
        this.log("warn", "⚠", message);
    }

    private clearProgress(): void {
        if (this.lastProgressLine) {
            process.stdout.write(`\r${" ".repeat(this.lastProgressLine.length)}\r`);
        }
    }

    private formatProgress(current: number, total: number): string {
        const percentage = ((current / total) * 100).toFixed(1);
        return `${current}/${total} (${percentage}%)`;
    }

    private log(level: LogLevel, symbol: LogSymbol, message: string): void {
        this.clearProgress();
        console.log(this.config.colors[level](this.config.symbols[symbol]), message);
    }

    private shouldUpdateProgress(): boolean {
        const now = Date.now();
        if (now - this.lastUpdateTime >= this.config.progressUpdateInterval) {
            this.lastUpdateTime = now;
            return true;
        }
        return false;
    }
}

export const logger = new Logger();
