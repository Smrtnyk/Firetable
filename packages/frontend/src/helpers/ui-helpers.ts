import { Dialog, Loading } from "quasar";
import { isString, NOOP } from "@firetable/utils";

export function showConfirm(title: string, message = ""): Promise<boolean> {
    const options = {
        title,
        message,
        persistent: true,
        ok: {
            size: "md",
            rounded: true,
            color: "primary",
        },
        cancel: {
            size: "md",
            outline: true,
            rounded: true,
            color: "negative",
        },
    };

    return new Promise((resolve) =>
        Dialog.create(options)
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false)),
    );
}

export function showErrorMessage(e: unknown): void {
    let message = "An unexpected error occurred.";
    if (isString(e)) {
        message = e;
    } else if (e instanceof Error) {
        message = e.message;
    }

    Dialog.create({
        title: "Error",
        message,
        class: "error-dialog",
    });
}

export function withLoading<T extends (...args: any[]) => Promise<any>>(fn: T) {
    return async function (...args: Parameters<T>): Promise<ReturnType<T> | void> {
        Loading.show();
        try {
            return await fn(...args);
        } catch (e) {
            showErrorMessage(e);
        } finally {
            Loading.hide();
        }
    };
}

type TryCatchLoadingWrapperOptions<T> = {
    hook: (...args: unknown[]) => Promise<T>;
    args?: unknown[];
    errorHook?: (...args: unknown[]) => void;
};

/**
 * Immediately executes passed in hook
 * It first calls a loading spinner, and awaits the hook to finish and then it hides the loading spinner
 *
 * @param hook An async function to run
 * @param args These arguments will be passed in to the hook
 * @param errorHook In case hook throws, errorHook will be executed
 */
export async function tryCatchLoadingWrapper<T>({
    hook,
    args,
    errorHook,
}: TryCatchLoadingWrapperOptions<T>): Promise<T | void> {
    try {
        Loading.show();
        return await hook(...(args ?? []));
    } catch (e) {
        showErrorMessage(e);
        (errorHook ?? NOOP)(...(args ?? []));
    } finally {
        Loading.hide();
    }
}
