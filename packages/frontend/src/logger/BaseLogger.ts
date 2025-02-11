/* eslint-disable no-console -- this file is fine to use this */
import { isString } from "es-toolkit";
import { isObject } from "es-toolkit/compat";

interface LoggerOptions {
    prefix?: string;
}

type LogLevel = "debug" | "error" | "info" | "warn";

export abstract class BaseLogger {
    private readonly prefix: string;

    protected constructor(options?: LoggerOptions) {
        this.prefix = options?.prefix ? `[${options.prefix}]` : "";
    }

    public debug(message: string, ...args: unknown[]): void {
        this.#log("debug", message, ...args);
    }

    public error(message: unknown, ...args: unknown[]): void {
        if (this.#isError(message)) {
            const errorMessage = `${this.prefix} [ERROR]: ${message.message}\nStack: ${message.stack}`;
            console.error(errorMessage, ...args);
        } else if (isString(message)) {
            this.#log("error", message, ...args);
        } else {
            this.#log("error", "An unknown error occurred", ...args);
        }
    }

    /**
     * Logs the error and appends it to the body of the HTML document.
     * Useful when debugging on mobile devices or when the console is not visible.
     * @param message - The error message or error object to log and display in the DOM.
     * @param args - Additional arguments for logging.
     */
    public errorAndAddToBody(message: unknown, ...args: unknown[]): void {
        this.error(message, ...args);

        const errorElement = document.createElement("div");

        errorElement.style.color = "red";
        errorElement.style.fontWeight = "bold";
        errorElement.style.margin = "10px 0";

        let errorText = `${this.prefix} [ERROR]: `;

        if (this.#isError(message)) {
            errorText += `${message.message}`;
        } else if (isString(message)) {
            errorText += `${message}`;
        } else {
            errorText += `An unknown error occurred`;
        }

        if (args.length > 0) {
            const formattedArgs = args.map((arg) => this.#formatArg(arg)).join(" ");
            errorText += ` | Additional Info: ${formattedArgs}`;
        }

        errorElement.textContent = errorText;

        document.body.appendChild(errorElement);
    }

    public info(message: string, ...args: unknown[]): void {
        this.#log("info", message, ...args);
    }

    public warn(message: string, ...args: unknown[]): void {
        this.#log("warn", message, ...args);
    }

    /**
     * Helper method to format additional arguments for appending to the DOM.
     * Converts objects, arrays, etc., into a string.
     */
    #formatArg(arg: unknown): string {
        if (isObject(arg)) {
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        }
        return String(arg);
    }

    #isError(value: unknown): value is Error {
        return value instanceof Error;
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
}
