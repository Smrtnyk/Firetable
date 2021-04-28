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
    if (typeof e === "string") message = e;
    if (e instanceof Error) message = e.message;

    Dialog.create({
        title: "Error",
        message,
        class: "error-dialog",
    });
}

export async function tryCatchLoadingWrapper<T>(
    hook: (...args: unknown[]) => Promise<T>,
    argums: unknown[] = [],
    errorHook: () => void = NOOP
): Promise<T | void> {
    try {
        Loading.show();
        return await hook(...argums);
    } catch (e) {
        showErrorMessage(e);
        errorHook();
    } finally {
        Loading.hide();
    }
}
