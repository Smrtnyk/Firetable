import { ref, onMounted, onUnmounted, Ref } from "vue";

const projectId = "firetable-eu";
const region = "europe-west3";
const functionName = "healthCheck";
const onlineCheckUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;

export function useNetworkStatus(): {
    isOnline: Ref<boolean>;
} {
    const isOnline = ref(window.navigator.onLine);

    // Helper function to perform an actual network request to verify internet connectivity
    const verifyConnectivity = async (): Promise<void> => {
        try {
            const response = await fetch(onlineCheckUrl, {
                method: "HEAD",
                cache: "no-cache",
            });
            isOnline.value = response.ok;
        } catch (error) {
            isOnline.value = false;
        }
    };

    const updateOnlineStatus = (): void => {
        isOnline.value = navigator.onLine;
        if (navigator.onLine) {
            // Perform an additional check to verify true connectivity
            void verifyConnectivity();
        }
    };

    onMounted(() => {
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        // Perform an initial connectivity check when the component is mounted
        void verifyConnectivity();
    });

    onUnmounted(() => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
    });

    return { isOnline };
}
