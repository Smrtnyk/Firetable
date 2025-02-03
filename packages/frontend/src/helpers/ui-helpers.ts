import type { VoidFunction } from "@firetable/types";

import { isString, noop } from "es-toolkit";
import { Dialog, Loading, Notify } from "quasar";

type TryCatchLoadingWrapperOptions<T> = {
    args?: unknown[];
    errorHook?: (...args: unknown[]) => void;
    hook: (...args: unknown[]) => Promise<T>;
};

export function notifyPositive(message: string): void {
    Notify.create({
        color: "positive",
        message,
    });
}

export function showConfirm(title: string, message = ""): Promise<boolean> {
    const options = {
        cancel: {
            color: "negative",
            outline: true,
            rounded: true,
            size: "md",
        },
        class: "ft-card",
        message,
        ok: {
            color: "primary",
            rounded: true,
            size: "md",
        },
        persistent: true,
        title,
    };

    return new Promise(function (resolve) {
        Dialog.create(options)
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false));
    });
}

export function showDeleteConfirm(
    title: string,
    message: string,
    confirmText: string,
): Promise<boolean> {
    return new Promise(function (resolve) {
        Dialog.create({
            cancel: {
                color: "negative",
                outline: true,
                rounded: true,
                size: "md",
            },
            class: "ft-card",
            message,
            ok: {
                color: "primary",
                rounded: true,
                size: "md",
            },
            persistent: true,
            prompt: {
                isValid: (val: string) => val === confirmText,
                model: "",
                placeholder: `Please type "${confirmText}" to confirm`,
                rounded: true,
                standout: true,
                type: "text",
            },
            title,
        })
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false));
    });
}

export function showErrorMessage(e: unknown, onCloseCallback?: VoidFunction): void {
    let message = "An unexpected error occurred.";
    if (isString(e)) {
        message = e;
    } else if (e instanceof Error) {
        message = e.message;
    }

    const dialog = Dialog.create({
        class: ["error-dialog", "ft-card"],
        message,
        title: "Error",
    });

    if (onCloseCallback) {
        dialog.onOk(onCloseCallback);
    }
}

/**
 * Immediately executes passed in hook
 * It first calls a loading spinner, and awaits the hook to finish and then it hides the loading spinner
 *
 * @param hook An async function to run
 * @param args These arguments will be passed in to the hook
 * @param errorHook In case hook throws, errorHook will be executed
 */
export async function tryCatchLoadingWrapper<T>({
    args,
    errorHook,
    hook,
}: TryCatchLoadingWrapperOptions<T>): Promise<T | undefined> {
    try {
        Loading.show();
        return await hook(...(args ?? []));
    } catch (e) {
        const errorHookVal = (errorHook ?? noop).bind(null, ...(args ?? []));
        showErrorMessage(e, errorHookVal);
    } finally {
        Loading.hide();
    }

    return undefined;
}
