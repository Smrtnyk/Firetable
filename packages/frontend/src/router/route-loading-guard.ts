import type { Router } from "vue-router";

import { useGlobalStore } from "src/stores/global-store";

export function setupRouteLoadingGuard(router: Router): void {
    router.beforeEach(() => {
        const globalStore = useGlobalStore();
        globalStore.startRouteLoading();
    });

    router.afterEach(() => {
        // Small delay to ensure smooth transition
        setTimeout(() => {
            const globalStore = useGlobalStore();
            globalStore.endRouteLoading();
        }, 100);
    });

    router.onError(() => {
        const globalStore = useGlobalStore();
        globalStore.endRouteLoading();
    });
}
