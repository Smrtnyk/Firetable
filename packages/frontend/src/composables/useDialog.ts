import { ref } from "vue";
import { DialogChainObject, QDialogOptions, useQuasar } from "quasar";

export function useDialog() {
    const quasar = useQuasar();
    const isDialogOpen = ref(false);
    let dialog: DialogChainObject | undefined;

    function createDialog(options: QDialogOptions): DialogChainObject {
        if (isDialogOpen.value && dialog) {
            return dialog;
        }

        isDialogOpen.value = true;

        dialog = quasar.dialog(options);

        dialog.onDismiss(() => {
            isDialogOpen.value = false;
            dialog = undefined;
        });

        return dialog;
    }

    return {
        createDialog,
    };
}
