import { noop } from "es-toolkit";
import { markRaw, readonly, shallowRef } from "vue";

import ConfirmDialog from "../components/ui/ConfirmDialog.vue";
import DeleteConfirmDialog from "../components/ui/DeleteConfirmDialog.vue";
import ErrorDialog from "../components/ui/ErrorDialog.vue";

export interface DialogController {
    hide(): void;
    onDismiss(callback: () => void): void;
}

interface ConfirmOptions {
    cancelText?: string;
    confirmText?: string;
    maxWidth?: number;
    message?: string;
    persistent?: boolean;
    title?: string;
    type?: "error" | "info" | "success" | "warning";
}

interface DeleteConfirmOptions {
    cancelText?: string;
    confirmText: string;
    maxWidth?: number;
    message: string;
    persistent?: boolean;
    title: string;
}

interface DialogContent {
    component: any;
    fullscreen: boolean | undefined;
    id: string;
    maxWidth?: number;
    onClose?: () => void;
    onDismiss?: () => void;
    persistent?: boolean;
    props?: Record<string, unknown>;
    title?: string;
    zIndex?: number;
}

interface DialogOptions {
    fullscreen?: boolean;
    maxWidth?: number;
    onClose?: () => void;
    persistent?: boolean;
    title?: string;
}

interface ErrorOptions {
    maxWidth?: number;
    message?: string;
    onClose?: () => void;
    title?: string;
}

const dialogStack = shallowRef<DialogContent[]>([]);

function useDialog() {
    function openDialog<T extends Record<string, unknown>>(
        component: any,
        componentProps: T,
        options: DialogOptions = {},
    ): DialogController {
        const dialogId = crypto.randomUUID();

        const dialog: DialogContent = {
            component: markRaw(component),
            fullscreen: options.fullscreen,
            id: dialogId,
            maxWidth: options.maxWidth ?? 600,
            onClose: options.onClose ?? noop,
            onDismiss: noop,
            persistent: options.persistent ?? true,
            props: componentProps,
            title: options.title ?? "",
            // Increase z-index for each dialog
            zIndex: 1000 + dialogStack.value.length * 10,
        };

        dialogStack.value = [...dialogStack.value, dialog];

        return {
            hide(): void {
                closeDialog(dialogId);
            },
            onDismiss(callback: () => void): void {
                const dialogIndex = dialogStack.value.findIndex((d) => d.id === dialogId);
                if (dialogIndex !== -1) {
                    const updatedStack = [...dialogStack.value];
                    updatedStack[dialogIndex] = {
                        ...updatedStack[dialogIndex],
                        onDismiss: callback,
                    };
                    dialogStack.value = updatedStack;
                }
            },
        };
    }

    function closeDialog(dialogId: string): void {
        const dialogIndex = dialogStack.value.findIndex((dialog) => dialog.id === dialogId);

        if (dialogIndex !== -1) {
            const dialog = dialogStack.value[dialogIndex];

            // Call both onClose and onDismiss callbacks
            if (dialog.onClose) {
                dialog.onClose();
            }

            if (dialog.onDismiss) {
                dialog.onDismiss();
            }

            const updatedStack = [...dialogStack.value];
            updatedStack.splice(dialogIndex, 1);
            dialogStack.value = updatedStack;
        }
    }

    function closeLatestDialog(): void {
        if (dialogStack.value.length > 0) {
            const latestDialog = dialogStack.value[dialogStack.value.length - 1];
            closeDialog(latestDialog.id);
        }
    }

    function closeAllDialogs(): void {
        dialogStack.value.forEach(function (dialog) {
            if (dialog.onClose) {
                dialog.onClose();
            }
            if (dialog.onDismiss) {
                dialog.onDismiss();
            }
        });

        dialogStack.value = [];
    }

    function confirmTitle(title: string): Promise<boolean> {
        return confirm({
            message: "",
            title,
        });
    }

    function confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            openDialog(
                ConfirmDialog,
                {
                    cancelText: options.cancelText ?? "No",
                    confirmText: options.confirmText ?? "Yes",
                    message: options.message,
                    onResult: (result: boolean) => {
                        resolve(result);
                    },
                },
                {
                    fullscreen: false,
                    maxWidth: options.maxWidth ?? 500,
                    persistent: options.persistent ?? true,
                    title: options.title ?? "Confirm",
                },
            );
        });
    }

    function deleteConfirm(options: DeleteConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            openDialog(
                DeleteConfirmDialog,
                {
                    confirmText: options.confirmText,
                    message: options.message,
                    onResult: resolve,
                },
                {
                    fullscreen: false,
                    maxWidth: options.maxWidth ?? 500,
                    persistent: options.persistent ?? true,
                    title: options.title,
                },
            );
        });
    }

    function showError(options: ErrorOptions): DialogController {
        return openDialog(
            ErrorDialog,
            {
                message: options.message,
            },
            {
                fullscreen: false,
                maxWidth: options.maxWidth ?? 500,
                onClose: options.onClose ?? noop,
                persistent: false,
                title: options.title ?? "Error",
            },
        );
    }

    return {
        closeAllDialogs,
        closeDialog,
        closeLatestDialog,
        confirm,
        confirmTitle,
        deleteConfirm,
        dialogs: readonly(dialogStack),
        openDialog,
        showError,
    };
}

const globalDialog = useDialog();
export { globalDialog };
