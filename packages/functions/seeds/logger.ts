import type { Formatter } from "tinyrainbow";
// eslint-disable-next-line id-length -- this is just logging symbols
import c from "tinyrainbow";

type LogLevel = "error" | "info" | "success" | "warn";
type LogSymbol = "⏱" | "⚠" | "✓" | "✖" | "📦" | "ℹ";
type StatsData = Record<string, number | string>;

interface LoggerConfig {
    // ms between progress updates
    progressUpdateInterval: number;
    symbols: Record<LogSymbol, string>;
    colors: Record<LogLevel, Formatter>;
}

class Logger {
    private lastProgressLine = "";
    private lastUpdateTime = 0;
    private readonly config: LoggerConfig = {
        // Update progress max every 100ms
        progressUpdateInterval: 100,
        symbols: {
            // eslint-disable-next-line id-length -- this is just logging symbols
            ℹ: "ℹ",
            "✓": "✓",
            "⚠": "⚠",
            "✖": "✖",
            "📦": "📦",
            "⏱": "⏱",
        },
        colors: {
            info: c.blue,
            success: c.green,
            warn: c.yellow,
            error: c.red,
        },
    };

    info(message: string): void {
        this.log("info", "ℹ", message);
    }

    success(message: string): void {
        this.log("success", "✓", message);
    }

    warn(message: string): void {
        this.log("warn", "⚠", message);
    }

    error(message: string): void {
        this.log("error", "✖", message);
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

    organization(current: number, total: number, name: string): void {
        this.clearProgress();
        console.log(
            c.blue(`\n${this.config.symbols["📦"]} Organization`),
            c.blue(`${current}/${total}`),
            c.white(`"${name}"`),
        );
    }

    stats(stats: StatsData, indent = 0): void {
        this.clearProgress();
        const padding = " ".repeat(indent);
        Object.entries(stats).forEach(([key, value]) => {
            console.log(c.gray(`${padding}• ${key}:`), c.white(value));
        });
    }

    timing(ms: number): void {
        this.clearProgress();
        const seconds = (ms / 1000).toFixed(2);
        console.log(c.gray(`${this.config.symbols["⏱"]} Completed in ${seconds}s`));
    }

    private clearProgress(): void {
        if (this.lastProgressLine) {
            process.stdout.write(`\r${" ".repeat(this.lastProgressLine.length)}\r`);
        }
    }

    private shouldUpdateProgress(): boolean {
        const now = Date.now();
        if (now - this.lastUpdateTime >= this.config.progressUpdateInterval) {
            this.lastUpdateTime = now;
            return true;
        }
        return false;
    }

    private formatProgress(current: number, total: number): string {
        const percentage = ((current / total) * 100).toFixed(1);
        return `${current}/${total} (${percentage}%)`;
    }

    private log(level: LogLevel, symbol: LogSymbol, message: string): void {
        this.clearProgress();
        console.log(this.config.colors[level](this.config.symbols[symbol]), message);
    }
}

export const logger = new Logger();
