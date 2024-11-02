import { AppLogger } from "src/logger/FTLogger";
import { Notify } from "quasar";
import { refreshApp } from "src/helpers/utils";

export function trackChunkFailures(): void {
    globalThis.addEventListener("unhandledrejection", function (event) {
        if (!event.reason?.message) {
            return;
        }

        if (!event.reason.message.includes("Failed to fetch dynamically imported module")) {
            return;
        }

        event.preventDefault();
        AppLogger.error("Chunk loading error:", event.reason);

        Notify.create({
            type: "negative",
            message: "A new version is available. Please refresh to update.",
            position: "top",
            timeout: 0,
            actions: [
                {
                    label: "Update Now",
                    color: "white",
                    handler: refreshApp,
                },
            ],
        });
    });
}
