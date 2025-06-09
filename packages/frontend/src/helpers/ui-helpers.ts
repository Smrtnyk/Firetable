import type { VoidFunction } from "@firetable/types";

import { noop } from "es-toolkit";
import { useGlobalStore } from "src/stores/global";

type TryCatchLoadingWrapperOptions<T> = {
    args?: unknown[];
    errorHook?: (...args: unknown[]) => void;
    hook: (...args: unknown[]) => Promise<T>;
};

export function showDeleteConfirm(
    title: string,
    message: string,
    confirmText: string,
): Promise<boolean> {
    // FIXME: implement proper delete confirmation dialog
    console.log(title, message, confirmText);
    return new Promise(function (resolve) {
        resolve(true);
    });
}

export function showErrorMessage(e: unknown, onCloseCallback?: VoidFunction): void {
    // FIXME: implement proper error handling
    console.log("showErrorMessage", e, onCloseCallback);
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
    const globalStore = useGlobalStore();
    try {
        globalStore.setLoading(true);
        return await hook(...(args ?? []));
    } catch (e) {
        const errorHookVal = (errorHook ?? noop).bind(null, ...(args ?? []));
        showErrorMessage(e, errorHookVal);
    } finally {
        globalStore.setLoading(false);
    }

    return undefined;
}
