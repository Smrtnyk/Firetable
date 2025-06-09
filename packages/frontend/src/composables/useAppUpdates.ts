import { ONE_HOUR } from "src/constants";
import { AppLogger } from "src/logger/FTLogger";
import { useGlobalStore } from "src/stores/global-store";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { ref, watch } from "vue";

export function useAppUpdates() {
    const updateAvailable = ref(false);
    const updateDismissed = ref(false);

    const { needRefresh, updateServiceWorker } = useRegisterSW({
        immediate: false,
        onRegisteredSW(swUrl, registration) {
            AppLogger.info("Service worker registered:", "AppUpdates", swUrl);

            if (registration) {
                setInterval(function () {
                    registration
                        .update()
                        .catch((err) => AppLogger.error("Failed to update SW:", err));
                }, ONE_HOUR);
            }
        },
        onRegisterError(error) {
            AppLogger.error("Service worker registration error:", "AppUpdates", error);
        },
    });

    watch(needRefresh, function (value) {
        if (!value) {
            return;
        }
        updateAvailable.value = true;
        updateDismissed.value = false;
    });

    watch(updateAvailable, function (value) {
        if (!value && needRefresh.value) {
            updateDismissed.value = true;
        }
    });

    async function applyUpdate(): Promise<void> {
        const globalStore = useGlobalStore();
        try {
            globalStore.setLoadingWithMessage("Applying update...");
            updateAvailable.value = false;
            updateDismissed.value = false;
            await updateServiceWorker(true);
        } finally {
            globalStore.setLoading(false);
        }
    }

    return {
        applyUpdate,
        checkForUpdates,
        updateAvailable,
        updateDismissed,
    };
}

async function checkForUpdates(): Promise<void> {
    if (!navigator.serviceWorker) return;

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            // eslint-disable-next-line no-await-in-loop -- fine here
            await registration.update();
        }
        AppLogger.info("Manual update check completed");
    } catch (err) {
        AppLogger.error("Failed to check for updates:", err);
    }
}
