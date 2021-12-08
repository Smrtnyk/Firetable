import { Dialog, Loading } from "quasar";
import { NOOP } from "src/helpers/utils";

export function showConfirm(title: string) {
    const options = {
        title,
        message: "Confirm delete?",
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
            .onCancel(() => resolve(false))
    );
}

export function showErrorMessage(e: unknown) {
    let message = "";
    if (typeof e === "string") {
        message = e;
    }
    if (e instanceof Error) {
        message = e.message;
    }

    Dialog.create({
        title: "Error",
        message,
        class: "error-dialog",
    });
}

export function loadingWrapper<T extends (...args: any[]) => Promise<any>>(fn: T) {
    return async function (...args: Parameters<T>): Promise<ReturnType<T> | void> {
        try {
            Loading.show();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return await fn(...args);
        } catch (e) {
            showErrorMessage(e);
        } finally {
            Loading.hide();
        }
    };
}

export async function tryCatchLoadingWrapper<T>(
    hook: (...args: unknown[]) => Promise<T>,
    argums: unknown[] = [],
    errorHook: (...args: unknown[]) => void = NOOP
): Promise<T | void> {
    try {
        Loading.show();
        return await hook(...argums);
    } catch (e) {
        showErrorMessage(e);
        errorHook(...argums);
    } finally {
        Loading.hide();
    }
}
