import { Dialog } from "quasar";

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
