import { noop } from "es-toolkit";
import { markRaw, readonly, shallowRef } from "vue";

interface BottomSheetContent {
    component: any;
    id: string;
    maxHeight?: number | undefined;
    onClose?: () => void;
    persistent?: boolean;
    props?: Record<string, unknown>;
    title?: string;
    zIndex?: number;
}

interface BottomSheetOptions {
    maxHeight?: number | undefined;
    onClose?: () => void;
    persistent?: boolean;
    title?: string;
}

const bottomSheetStack = shallowRef<BottomSheetContent[]>([]);

function useBottomSheet() {
    function openBottomSheet<T extends Record<string, unknown>>(
        component: any,
        componentProps: T,
        options: BottomSheetOptions = {},
    ): string {
        const bottomSheetId = crypto.randomUUID();

        const bottomSheet: BottomSheetContent = {
            component: markRaw(component),
            id: bottomSheetId,
            maxHeight: options.maxHeight,
            onClose: options.onClose ?? noop,
            persistent: options.persistent ?? true,
            props: componentProps,
            title: options.title ?? "",
            zIndex: 1000 + bottomSheetStack.value.length * 10,
        };

        bottomSheetStack.value = [...bottomSheetStack.value, bottomSheet];

        return bottomSheetId;
    }

    function closeBottomSheet(bottomSheetId: string): void {
        const sheetIndex = bottomSheetStack.value.findIndex((sheet) => sheet.id === bottomSheetId);

        if (sheetIndex !== -1) {
            const sheet = bottomSheetStack.value[sheetIndex];

            if (sheet.onClose) {
                sheet.onClose();
            }

            const updatedStack = [...bottomSheetStack.value];
            updatedStack.splice(sheetIndex, 1);
            bottomSheetStack.value = updatedStack;
        }
    }

    function closeLatestBottomSheet(): void {
        if (bottomSheetStack.value.length > 0) {
            const latestSheet = bottomSheetStack.value[bottomSheetStack.value.length - 1];
            closeBottomSheet(latestSheet.id);
        }
    }

    function closeAllBottomSheets(): void {
        bottomSheetStack.value.forEach(function (sheet) {
            if (sheet.onClose) {
                sheet.onClose();
            }
        });

        bottomSheetStack.value = [];
    }

    return {
        bottomSheets: readonly(bottomSheetStack),
        closeAllBottomSheets,
        closeBottomSheet,
        closeLatestBottomSheet,
        openBottomSheet,
    };
}

const globalBottomSheet = useBottomSheet();
export { globalBottomSheet };
