import { defineStore } from "pinia";
import { readonly, ref } from "vue";

export const useGlobalStore = defineStore("global", function () {
    const isRouteLoading = ref(false);

    function startRouteLoading(): void {
        isRouteLoading.value = true;
    }

    function endRouteLoading(): void {
        isRouteLoading.value = false;
    }

    return {
        endRouteLoading,
        isRouteLoading: readonly(isRouteLoading),
        startRouteLoading,
    };
});
