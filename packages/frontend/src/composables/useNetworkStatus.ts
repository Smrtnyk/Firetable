import type { Ref } from "vue";
import { ref, onMounted } from "vue";
import { useEventListener } from "@vueuse/core";

const onlineCheckUrl = "https://www.google.com/favicon.ico";

export function useNetworkStatus(): {
    isOnline: Ref<boolean>;
} {
    const isOnline = ref(globalThis.navigator.onLine);

    // Helper function to perform an actual network request to verify internet connectivity
    async function verifyConnectivity(): Promise<void> {
        try {
            await fetch(onlineCheckUrl, {
                method: "HEAD",
                mode: "no-cors",
            });
            isOnline.value = true;
        } catch (error) {
            isOnline.value = false;
        }
    }

    function updateOnlineStatus(): void {
        isOnline.value = navigator.onLine;
        if (navigator.onLine) {
            // Perform an additional check to verify true connectivity
            void verifyConnectivity();
        }
    }

    onMounted(function () {
        useEventListener("online", updateOnlineStatus);
        useEventListener("offline", updateOnlineStatus);
        // Perform an initial connectivity check when the component is mounted
        void verifyConnectivity();
    });

    return { isOnline };
}
