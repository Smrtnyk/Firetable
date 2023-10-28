import { DialogChainObject, QDialogOptions, useQuasar } from "quasar";

export function useDialog() {
    const quasar = useQuasar();

    function createDialog(options: QDialogOptions): DialogChainObject {
        return quasar.dialog(options);
    }

    return {
        createDialog,
    };
}
