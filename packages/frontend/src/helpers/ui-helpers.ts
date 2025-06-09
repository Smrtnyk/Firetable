import { isError, noop } from "es-toolkit";
import { globalDialog } from "src/composables/useDialog";
import { AppLogger } from "src/logger/FTLogger";
import { useGlobalStore } from "src/stores/global-store";

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
    return globalDialog.deleteConfirm({
        confirmText,
        message,
        title,
    });
}

export function showErrorMessage(e: unknown, onCloseCallback = noop): void {
    AppLogger.error(e);
    const errorDialog = globalDialog.showError({
        message: isError(e) ? e.message : String(e),
        onClose: onCloseCallback,
    });

    if (onCloseCallback) {
        errorDialog.onDismiss(onCloseCallback);
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
