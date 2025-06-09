import { noop } from "es-toolkit";
import { markRaw, readonly, shallowRef } from "vue";

import ConfirmDialog from "../components/ui/ConfirmDialog.vue";

interface ConfirmOptions {
    cancelText?: string;
    confirmText?: string;
    maxWidth?: number;
    message?: string;
    persistent?: boolean;
    title?: string;
    type?: "error" | "info" | "success" | "warning";
}

interface DialogContent {
    component: any;
    fullscreen: boolean | undefined;
    id: string;
    maxWidth?: number;
    onClose?: () => void;
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

const dialogStack = shallowRef<DialogContent[]>([]);

function useDialog() {
    function openDialog<T extends Record<string, unknown>>(
        component: any,
        componentProps: T,
        options: DialogOptions = {},
    ): string {
        const dialogId = crypto.randomUUID();

        const dialog: DialogContent = {
            component: markRaw(component),
            fullscreen: options.fullscreen,
            id: dialogId,
            maxWidth: options.maxWidth ?? 600,
            onClose: options.onClose ?? noop,
            persistent: options.persistent ?? true,
            props: componentProps,
            title: options.title ?? "",
            // Increase z-index for each dialog
            zIndex: 1000 + dialogStack.value.length * 10,
        };

        dialogStack.value = [...dialogStack.value, dialog];

        return dialogId;
    }

    function closeDialog(dialogId: string): void {
        const dialogIndex = dialogStack.value.findIndex((dialog) => dialog.id === dialogId);

        if (dialogIndex !== -1) {
            const dialog = dialogStack.value[dialogIndex];

            if (dialog.onClose) {
                dialog.onClose();
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
        });

        dialogStack.value = [];
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
                    persistent: options.persistent ?? true,
                    title: options.title ?? "Confirm",
                },
            );
        });
    }

    return {
        closeAllDialogs,
        closeDialog,
        closeLatestDialog,
        confirm,
        dialogs: readonly(dialogStack),
        openDialog,
    };
}

const globalDialog = useDialog();
export { globalDialog };
