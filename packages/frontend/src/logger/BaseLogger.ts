/* eslint-disable no-console -- this file is fine to use this */
type LogLevel = "debug" | "error" | "info" | "warn";

interface LoggerOptions {
    prefix?: string;
}

export abstract class BaseLogger {
    private readonly prefix: string;

    protected constructor(options?: LoggerOptions) {
        this.prefix = options?.prefix ? `[${options.prefix}]` : "";
    }

    public info(message: string, ...args: unknown[]): void {
        this.#log("info", message, ...args);
    }

    public warn(message: string, ...args: unknown[]): void {
        this.#log("warn", message, ...args);
    }

    public error(message: unknown, ...args: unknown[]): void {
        if (this.#isError(message)) {
            const errorMessage = `${this.prefix} [ERROR]: ${message.message}\nStack: ${message.stack}`;
            console.error(errorMessage, ...args);
        } else if (typeof message === "string") {
            this.#log("error", message, ...args);
        } else {
            this.#log("error", "An unknown error occurred", ...args);
        }
    }

    public debug(message: string, ...args: unknown[]): void {
        this.#log("debug", message, ...args);
    }

    #log(level: LogLevel, message: string, ...args: unknown[]): void {
        const formattedMessage = `${this.prefix} [${level.toUpperCase()}]: ${message}`;
        if (level === "error") {
            console.error(formattedMessage, ...args);
        } else if (level === "warn") {
            console.warn(formattedMessage, ...args);
        } else if (level === "debug") {
            console.debug(formattedMessage, ...args);
        } else {
            console.info(formattedMessage, ...args);
        }
    }

    #isError(value: unknown): value is Error {
        return value instanceof Error;
    }
}
