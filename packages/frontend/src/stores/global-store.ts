import { isString } from "es-toolkit";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface NotificationAction {
    color?: string;
    handler: () => void;
    label: string;
    noDismiss?: boolean;
}

interface NotificationOptions {
    actions?: NotificationAction[];
    color?: string;
    message: string;
    position?: "bottom" | "center" | "top";
    timeout?: number;
    type?: "error" | "info" | "ongoing" | "success" | "warning";
}

interface NotificationState {
    actions: NotificationAction[] | undefined;
    color: string;
    id: string;
    message: string;
    position: "bottom" | "center" | "top";
    show: boolean;
    timeout: number;
    type: "error" | "info" | "ongoing" | "success" | "warning";
}

export const useGlobalStore = defineStore("global", () => {
    const globalLoading = ref(false);
    const globalLoadingMessage = ref("");
    const notifications = ref<NotificationState[]>([]);

    function notify(message: string, color = "success", timeout = 3000): () => void {
        return notifyAdvanced({
            color,
            message,
            timeout,
        });
    }

    function notifyAdvanced(options: NotificationOptions): () => void {
        const id = crypto.randomUUID();

        const notification: NotificationState = {
            actions: options.actions,
            color: options.color ?? "success",
            id,
            message: options.message,
            position: options.position ?? "bottom",
            show: true,
            timeout: options.timeout ?? 3000,
            type: options.type ?? "info",
        };

        notifications.value.push(notification);

        // Auto-dismiss after timeout (unless timeout is 0)
        if (notification.timeout > 0) {
            setTimeout(() => {
                dismissNotification(id);
            }, notification.timeout);
        }

        return () => dismissNotification(id);
    }

    function dismissNotification(id: string): void {
        const index = notifications.value.findIndex((n) => n.id === id);
        if (index !== -1) {
            notifications.value.splice(index, 1);
        }
    }

    function dismissAllNotifications(): void {
        notifications.value = [];
    }

    function notifyError(error: unknown, timeout = 3000): void {
        let msg: string;
        if (error instanceof Error) {
            msg = error.message;
        } else if (isString(error)) {
            msg = error;
        } else {
            msg = "An unknown error occurred.";
        }
        notifyAdvanced({
            color: "error",
            message: msg,
            timeout,
            type: "error",
        });
    }

    function setLoading(isLoading: boolean): void {
        globalLoading.value = isLoading;
        if (!isLoading) {
            globalLoadingMessage.value = "";
        }
    }

    function setLoadingWithMessage(message: string): void {
        globalLoading.value = true;
        globalLoadingMessage.value = message;
    }

    const isRouteLoading = ref(false);

    function startRouteLoading(): void {
        isRouteLoading.value = true;
    }

    function endRouteLoading(): void {
        isRouteLoading.value = false;
    }

    return {
        dismissAllNotifications,
        dismissNotification,
        endRouteLoading,
        globalLoading,
        globalLoadingMessage,
        isRouteLoading,
        notifications,
        notify,
        notifyAdvanced,
        notifyError,
        setLoading,
        setLoadingWithMessage,
        startRouteLoading,
    };
});
